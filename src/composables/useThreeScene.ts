import { ref, reactive, nextTick, watch } from 'vue';
import type { Ref } from 'vue';
import type { ViewState, SliceConfig, ExamShapeDef } from '../types';
import type { ThreeHandle } from '../three/types';
import {
  createScene, animateLoop, disposeScene,
  setCameraView as sceneSetCameraView,
  handleVoxelClick, clearVoxels,
} from '../three/scene';
import { loadShape, updateSlice, lookAtSection as csgLookAtSection } from '../three/section';
import { EXAM_SHAPES } from '../three/shapes';

const DEFAULT_SLICE: SliceConfig = { constant: 0, rotX: 90, rotY: 0, rotZ: 0 };

interface ThreeSceneContext {
  viewState: Ref<ViewState>;
}

export function useThreeScene({ viewState }: ThreeSceneContext) {
  const cubicMode = ref<'block' | 'section'>('block');
  const isDeleteMode = ref(false);
  const showShapeMenu = ref(false);
  const sliceMenuCollapsed = ref(false);
  const currentShapeName = ref('正方体');
  const colors = ['#007aff', '#ff9500', '#333333', '#ffffff'];
  const selectedColor = ref('#007aff');
  const sliceConfig: SliceConfig = reactive({ ...DEFAULT_SLICE });

  // Non-reactive Three.js state (Vue should not proxy GPU objects).
  let handle: ThreeHandle | null = null;
  let container: HTMLElement | null = null;
  let downTime = 0;

  const handlePointerDown = () => { downTime = Date.now(); };
  const handlePointerUp = (event: PointerEvent) => {
    if (Date.now() - downTime >= 200) return;
    if (cubicMode.value === 'section' || !handle) return;
    handleVoxelClick(handle, event, {
      isDeleteMode: isDeleteMode.value,
      selectedColor: selectedColor.value,
    });
  };

  const resetSlice = () => {
    Object.assign(sliceConfig, DEFAULT_SLICE);
  };

  const loadExamShape = (shapeConf: ExamShapeDef) => {
    internalClearCubes();
    showShapeMenu.value = false;
    currentShapeName.value = shapeConf.name;
    resetSlice();
    if (handle) {
      loadShape(handle, shapeConf);
      updateSlice(handle, sliceConfig);
    }
  };

  const internalClearCubes = () => {
    if (handle) clearVoxels(handle);
  };

  const switchColor = (c: string) => {
    selectedColor.value = c;
    isDeleteMode.value = false;
  };

  const toggleDeleteMode = () => {
    isDeleteMode.value = !isDeleteMode.value;
  };

  const setCameraView = (type: 'front' | 'left' | 'top' | 'iso') => {
    sceneSetCameraView(handle, type);
  };

  const lookAtSection = () => {
    if (handle) csgLookAtSection(handle, sliceConfig);
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

  const startCubicMode = (mode: 'block' | 'section' = 'block') => {
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
    loadExamShape,
    clearCubes: internalClearCubes,
    resetSlice,
    cleanup,
  };
}
