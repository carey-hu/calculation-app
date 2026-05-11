import { ref, reactive, nextTick, watch } from 'vue';
import {
  createScene, animateLoop, disposeScene,
  setCameraView as sceneSetCameraView,
  handleVoxelClick, clearVoxels,
} from '../three/scene';
import { loadShape, updateSlice, lookAtSection as csgLookAtSection } from '../three/section';
import { EXAM_SHAPES } from '../three/shapes';

const DEFAULT_SLICE = { constant: 0, rotX: 90, rotY: 0, rotZ: 0 };

export function useThreeScene({ viewState }) {
  const cubicMode = ref('block');
  const isDeleteMode = ref(false);
  const showShapeMenu = ref(false);
  const sliceMenuCollapsed = ref(false);
  const currentShapeName = ref('正方体');
  const colors = ['#007aff', '#ff9500', '#333333', '#ffffff'];
  const selectedColor = ref('#007aff');
  const sliceConfig = reactive({ ...DEFAULT_SLICE });

  // Non-reactive Three.js state (Vue should not proxy GPU objects).
  let handle = null;
  let container = null;
  let downTime = 0;

  const handlePointerDown = () => { downTime = Date.now(); };
  const handlePointerUp = (event) => {
    if (Date.now() - downTime >= 200) return;
    if (cubicMode.value === 'section') return;
    handleVoxelClick(handle, event, {
      isDeleteMode: isDeleteMode.value,
      selectedColor: selectedColor.value,
    });
  };

  const resetSlice = () => {
    Object.assign(sliceConfig, DEFAULT_SLICE);
  };

  const loadExamShape = (shapeConf) => {
    clearCubes();
    showShapeMenu.value = false;
    currentShapeName.value = shapeConf.name;
    resetSlice();
    loadShape(handle, shapeConf);
    updateSlice(handle, sliceConfig);
  };

  const clearCubes = () => {
    if (handle) clearVoxels(handle);
  };

  const switchColor = (c) => {
    selectedColor.value = c;
    isDeleteMode.value = false;
  };

  const toggleDeleteMode = () => {
    isDeleteMode.value = !isDeleteMode.value;
  };

  const setCameraView = (type) => {
    sceneSetCameraView(handle, type);
  };

  const lookAtSection = () => {
    csgLookAtSection(handle, sliceConfig);
  };

  const cleanup = () => {
    if (!handle) return;
    if (container) {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
    }
    disposeScene(handle, container);
    handle = null;
    container = null;
  };

  const startCubicMode = (mode = 'block') => {
    cubicMode.value = mode;
    viewState.value = 'cubic';
    sliceMenuCollapsed.value = false;
    resetSlice();
    nextTick(() => {
      container = document.getElementById('three-container');
      if (!container) return;
      handle = createScene(container, { showGrid: mode === 'block' });
      const dom = handle.renderer.domElement;
      dom.addEventListener('pointerdown', handlePointerDown);
      dom.addEventListener('pointerup', handlePointerUp);
      animateLoop(handle);
      if (mode === 'section') {
        loadExamShape(EXAM_SHAPES.basic[0]);
      }
      if (handle.gridHelper) {
        handle.gridHelper.visible = mode === 'block';
      }
    });
  };

  const quitCubicMode = () => {
    cleanup();
    viewState.value = 'home';
    isDeleteMode.value = false;
    showShapeMenu.value = false;
  };

  watch(sliceConfig, () => {
    if (handle && handle.csg) updateSlice(handle, sliceConfig);
  }, { deep: true });

  return {
    // state
    cubicMode, isDeleteMode, showShapeMenu, sliceMenuCollapsed,
    currentShapeName, colors, selectedColor, sliceConfig,
    examShapes: EXAM_SHAPES,
    // actions
    startCubicMode, quitCubicMode,
    switchColor, toggleDeleteMode,
    setCameraView, lookAtSection,
    loadExamShape, clearCubes,
    resetSlice,
    cleanup,
  };
}
