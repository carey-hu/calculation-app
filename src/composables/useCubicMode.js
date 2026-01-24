/**
 * 3D 积木模块
 * 使用 Three.js 实现立体拼合训练
 */

import { ref, reactive, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function useCubicMode() {
  // ============================================================
  // 状态
  // ============================================================
  
  const isDeleteMode = ref(false)
  const isSliceMode = ref(false)
  const selectedColor = ref('#007aff')
  const colors = ['#007aff', '#ff9500', '#333333', '#ffffff']
  
  const sliceConfig = reactive({
    constant: 5,
    x: 0,
    y: -1,
    z: 0
  })
  
  // Three.js 对象
  const threeApp = reactive({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    raycaster: null,
    objects: [],
    animationId: null,
    clippingPlane: null,
    planeHelper: null,
    groundPlane: null
  })
  
  // ============================================================
  // 方法
  // ============================================================
  
  function initThree(containerId = 'three-container') {
    const container = document.getElementById(containerId)
    if (!container) return false
    
    const width = container.clientWidth
    const height = container.clientHeight
    
    // 场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f2f2f7')
    scene.fog = new THREE.Fog('#f2f2f7', 20, 50)
    
    // 正交相机
    const aspect = width / height
    const d = 18
    const camera = new THREE.OrthographicCamera(
      -d * aspect, d * aspect,
      d, -d,
      1, 1000
    )
    
    // 初始视角位置
    const targetY = 6
    camera.position.set(12, 12 + targetY, 12)
    camera.lookAt(0, targetY, 0)
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.localClippingEnabled = false
    container.appendChild(renderer.domElement)
    
    // 裁剪平面
    const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 5)
    const planeHelper = new THREE.PlaneHelper(clippingPlane, 20, 0xff0000)
    planeHelper.visible = false
    scene.add(planeHelper)
    
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)
    
    // 辅助网格
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xdddddd)
    scene.add(gridHelper)
    
    // 地面
    const planeGeometry = new THREE.PlaneGeometry(20, 20)
    planeGeometry.rotateX(-Math.PI / 2)
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      visible: true, 
      transparent: true, 
      opacity: 0 
    })
    const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial)
    groundPlane.name = 'ground'
    scene.add(groundPlane)
    
    // 控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, targetY, 0)
    controls.update()
    
    // 交互事件
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let downTime = 0
    
    renderer.domElement.addEventListener('pointerdown', () => {
      downTime = Date.now()
    })
    
    renderer.domElement.addEventListener('pointerup', (event) => {
      if (Date.now() - downTime < 200) {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        handleClick(raycaster, pointer, scene, camera)
      }
    })
    
    // 保存引用
    threeApp.scene = scene
    threeApp.camera = camera
    threeApp.renderer = renderer
    threeApp.controls = controls
    threeApp.raycaster = raycaster
    threeApp.clippingPlane = clippingPlane
    threeApp.planeHelper = planeHelper
    threeApp.groundPlane = groundPlane
    threeApp.objects = [groundPlane]
    
    // 开始动画循环
    animate()
    
    return true
  }
  
  function animate() {
    const { scene, camera, renderer, controls } = threeApp
    if (!renderer) return
    
    threeApp.animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  
  function handleClick(raycaster, pointer, scene, camera) {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(threeApp.objects, false)
    
    if (intersects.length > 0) {
      const intersect = intersects[0]
      
      if (isDeleteMode.value) {
        // 删除模式
        if (intersect.object.name !== 'ground') {
          scene.remove(intersect.object)
          const idx = threeApp.objects.indexOf(intersect.object)
          if (idx > -1) threeApp.objects.splice(idx, 1)
          intersect.object.geometry.dispose()
          intersect.object.material.dispose()
        }
      } else {
        // 放置模式
        const voxelPos = new THREE.Vector3()
          .copy(intersect.point)
          .addScaledVector(intersect.face.normal, 0.5)
        voxelPos.divideScalar(1).floor().multiplyScalar(1).addScalar(0.5)
        
        if (voxelPos.y < 0) return
        addCubeAt(voxelPos)
      }
    }
  }
  
  function addCubeAt(position) {
    const { scene, clippingPlane, objects } = threeApp
    
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshLambertMaterial({
      color: selectedColor.value,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      clippingPlanes: [clippingPlane]
    })
    
    const cube = new THREE.Mesh(geometry, material)
    cube.position.copy(position)
    
    // 边线
    const isDarkBlock = selectedColor.value === '#333333'
    const edgeColor = isDarkBlock ? 0xffffff : 0x000000
    
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: edgeColor,
      clippingPlanes: [clippingPlane]
    })
    const line = new THREE.LineSegments(edges, lineMaterial)
    cube.add(line)
    
    scene.add(cube)
    objects.push(cube)
  }
  
  function switchColor(color) {
    selectedColor.value = color
    isDeleteMode.value = false
  }
  
  function toggleDeleteMode() {
    isDeleteMode.value = !isDeleteMode.value
    if (isDeleteMode.value) {
      isSliceMode.value = false
    }
  }
  
  function toggleSliceMode() {
    isSliceMode.value = !isSliceMode.value
    if (isSliceMode.value) {
      isDeleteMode.value = false
      if (threeApp.planeHelper) threeApp.planeHelper.visible = true
      threeApp.renderer.localClippingEnabled = true
    } else {
      if (threeApp.planeHelper) threeApp.planeHelper.visible = false
      threeApp.renderer.localClippingEnabled = false
    }
  }
  
  function updateSlicePlane() {
    if (!threeApp.clippingPlane) return
    
    const { x, y, z, constant } = sliceConfig
    const normal = new THREE.Vector3(x, y, z).normalize()
    if (normal.length() === 0) normal.set(0, -1, 0)
    
    threeApp.clippingPlane.normal.copy(normal)
    threeApp.clippingPlane.constant = constant
  }
  
  function resetSlice() {
    sliceConfig.constant = 5
    sliceConfig.x = 0
    sliceConfig.y = -1
    sliceConfig.z = 0
    updateSlicePlane()
  }
  
  function setCameraView(type) {
    const { camera, controls } = threeApp
    if (!camera || !controls) return
    
    const dist = 20
    const targetY = 6
    
    controls.target.set(0, targetY, 0)
    
    const positions = {
      front: [0, targetY, dist],
      back: [0, targetY, -dist],
      left: [-dist, targetY, 0],
      right: [dist, targetY, 0],
      top: [0, dist + targetY, 0],
      iso: [12, 12 + targetY, 12]
    }
    
    const pos = positions[type]
    if (pos) {
      camera.position.set(...pos)
      camera.lookAt(0, targetY, 0)
      controls.update()
    }
  }
  
  function clearCubes() {
    const { scene, objects } = threeApp
    
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      if (obj.name !== 'ground') {
        scene.remove(obj)
        obj.geometry.dispose()
        obj.material.dispose()
        objects.splice(i, 1)
      }
    }
  }
  
  function cleanup() {
    if (threeApp.animationId) {
      cancelAnimationFrame(threeApp.animationId)
    }
    
    if (threeApp.renderer) {
      threeApp.renderer.dispose()
      const container = document.getElementById('three-container')
      if (container) container.innerHTML = ''
    }
    
    // 重置状态
    threeApp.scene = null
    threeApp.camera = null
    threeApp.renderer = null
    threeApp.controls = null
    threeApp.objects = []
    threeApp.animationId = null
    
    isSliceMode.value = false
    isDeleteMode.value = false
  }
  
  // ============================================================
  // 返回
  // ============================================================
  
  return {
    // 状态
    isDeleteMode,
    isSliceMode,
    selectedColor,
    colors,
    sliceConfig,
    
    // 方法
    initThree,
    switchColor,
    toggleDeleteMode,
    toggleSliceMode,
    updateSlicePlane,
    resetSlice,
    setCameraView,
    clearCubes,
    cleanup
  }
}
