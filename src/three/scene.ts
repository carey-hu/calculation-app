import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ThreeHandle, CameraViewType } from './types';

interface CreateSceneOpts {
  showGrid?: boolean;
}

export const createScene = (container: HTMLElement, { showGrid = true }: CreateSceneOpts = {}): ThreeHandle => {
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

  const handle: ThreeHandle = {
    scene, camera, renderer, controls,
    gridHelper, sliceHelper, plane,
    raycaster, pointer,
    objects: [plane],
    examGroup: null,
    csg: null,
    animationId: null,
    contextLost: false,
    onContextLost: null,
    onContextRestored: null,
  };

  const canvas = renderer.domElement;

  handle.onContextLost = (e: Event) => {
    e.preventDefault();
    handle.contextLost = true;
    if (handle.animationId != null) {
      cancelAnimationFrame(handle.animationId);
      handle.animationId = null;
    }
  };

  handle.onContextRestored = () => {
    handle.contextLost = false;
    // Only restart if still mounted (renderer hasn't been disposed).
    if (handle.renderer) {
      animateLoop(handle);
    }
  };

  canvas.addEventListener('webglcontextlost', handle.onContextLost);
  canvas.addEventListener('webglcontextrestored', handle.onContextRestored);

  return handle;
};

export const animateLoop = (handle: ThreeHandle): void => {
  const tick = () => {
    if (!handle.renderer || handle.contextLost) return;
    handle.animationId = requestAnimationFrame(tick);
    handle.controls.update();
    handle.renderer.render(handle.scene, handle.camera);
  };
  tick();
};

export const setCameraView = (handle: ThreeHandle | null, type: CameraViewType): void => {
  if (!handle) return;
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

export const disposeScene = (handle: ThreeHandle | null, container: HTMLElement | null): void => {
  if (!handle) return;
  if (handle.animationId != null) cancelAnimationFrame(handle.animationId);
  if (handle.renderer) {
    const canvas = handle.renderer.domElement;
    if (handle.onContextLost) canvas.removeEventListener('webglcontextlost', handle.onContextLost);
    if (handle.onContextRestored) canvas.removeEventListener('webglcontextrestored', handle.onContextRestored);
    handle.renderer.dispose();
    if (container) container.innerHTML = '';
  }
  // Null out all references to allow GC.
  const h = handle as unknown as Record<string, unknown>;
  h.scene = null;
  h.camera = null;
  h.renderer = null;
  h.controls = null;
  handle.objects = [];
  handle.examGroup = null;
  handle.csg = null;
  handle.sliceHelper = null as unknown as THREE.Mesh;
  handle.gridHelper = null as unknown as THREE.GridHelper;
};

export const addCubeAt = (handle: ThreeHandle, position: THREE.Vector3, color: string): void => {
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

export const handleVoxelClick = (
  handle: ThreeHandle,
  event: PointerEvent,
  { isDeleteMode, selectedColor }: { isDeleteMode: boolean; selectedColor: string },
): void => {
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
    if (intersect.object instanceof THREE.Mesh) {
      intersect.object.geometry.dispose();
      if (Array.isArray(intersect.object.material)) {
        intersect.object.material.forEach((m) => m.dispose());
      } else {
        intersect.object.material.dispose();
      }
    }
    return;
  }

  const voxelPos = new THREE.Vector3()
    .copy(intersect.point)
    .addScaledVector(intersect.face!.normal, 0.5);
  voxelPos.divideScalar(1).floor().multiplyScalar(1).addScalar(0.5);
  if (voxelPos.y < 0) return;
  addCubeAt(handle, voxelPos, selectedColor);
};

export const clearVoxels = (handle: ThreeHandle): void => {
  const { scene, objects } = handle;
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.name !== 'ground') {
      scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
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
