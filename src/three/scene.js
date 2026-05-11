import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const createScene = (container, { showGrid = true } = {}) => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f2f2f7');
  scene.fog = new THREE.Fog('#f2f2f7', 30, 80);

  const aspect = width / height;
  const d = 16;
  const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
  camera.position.set(12, 12, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe5e5e5);
  gridHelper.visible = showGrid;
  scene.add(gridHelper);

  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  planeGeometry.rotateX(-Math.PI / 2);
  const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.name = 'ground';
  scene.add(plane);

  const sliceGeo = new THREE.PlaneGeometry(15, 15);
  const sliceMat = new THREE.MeshBasicMaterial({
    color: 0xff3b30,
    opacity: 0.1,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const sliceHelper = new THREE.Mesh(sliceGeo, sliceMat);
  sliceHelper.visible = false;
  scene.add(sliceHelper);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.update();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  return {
    scene, camera, renderer, controls,
    gridHelper, sliceHelper, plane,
    raycaster, pointer,
    objects: [plane],
    examGroup: null,
    csg: null,
    animationId: null,
  };
};

export const animateLoop = (handle) => {
  const tick = () => {
    if (!handle.renderer) return;
    handle.animationId = requestAnimationFrame(tick);
    handle.controls.update();
    handle.renderer.render(handle.scene, handle.camera);
  };
  tick();
};

export const setCameraView = (handle, type) => {
  const { camera, controls } = handle;
  if (!camera || !controls) return;
  const dist = 20;
  const targetY = 0;
  controls.target.set(0, targetY, 0);
  switch (type) {
    case 'front': camera.position.set(0, targetY, dist); break;
    case 'back':  camera.position.set(0, targetY, -dist); break;
    case 'left':  camera.position.set(-dist, targetY, 0); break;
    case 'right': camera.position.set(dist, targetY, 0); break;
    case 'top':   camera.position.set(0, dist, 0); break;
    case 'iso':   camera.position.set(12, 12, 12); break;
    default: break;
  }
  camera.lookAt(0, targetY, 0);
  controls.update();
};

export const disposeScene = (handle, container) => {
  if (handle.animationId) cancelAnimationFrame(handle.animationId);
  if (handle.renderer) {
    handle.renderer.dispose();
    if (container) container.innerHTML = '';
  }
  handle.scene = null;
  handle.camera = null;
  handle.renderer = null;
  handle.controls = null;
  handle.objects = [];
  handle.examGroup = null;
  handle.csg = null;
  handle.sliceHelper = null;
  handle.gridHelper = null;
};

export const addCubeAt = (handle, position, color) => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({ color });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.copy(position);

  const edges = new THREE.EdgesGeometry(geometry);
  const edgeColor = color === '#333333' ? 0xffffff : 0x000000;
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor }));
  cube.add(line);

  handle.scene.add(cube);
  handle.objects.push(cube);
};

export const handleVoxelClick = (handle, event, { isDeleteMode, selectedColor }) => {
  const { renderer, raycaster, pointer, scene, camera, objects } = handle;
  if (!renderer) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(objects, false);
  if (intersects.length === 0) return;

  const intersect = intersects[0];
  if (isDeleteMode) {
    if (intersect.object.name === 'ground') return;
    scene.remove(intersect.object);
    const idx = objects.indexOf(intersect.object);
    if (idx > -1) objects.splice(idx, 1);
    intersect.object.geometry.dispose();
    intersect.object.material.dispose();
    return;
  }

  const voxelPos = new THREE.Vector3()
    .copy(intersect.point)
    .addScaledVector(intersect.face.normal, 0.5);
  voxelPos.divideScalar(1).floor().multiplyScalar(1).addScalar(0.5);
  if (voxelPos.y < 0) return;
  addCubeAt(handle, voxelPos, selectedColor);
};

export const clearVoxels = (handle) => {
  const { scene, objects } = handle;
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.name !== 'ground') {
      scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
      objects.splice(i, 1);
    }
  }
  if (handle.examGroup) {
    scene.remove(handle.examGroup);
    handle.examGroup = null;
  }
  if (handle.sliceHelper) {
    handle.sliceHelper.visible = false;
  }
};
