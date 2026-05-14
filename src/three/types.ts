import type * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Brush, Evaluator } from 'three-bvh-csg';
import type { ExamShapeDef } from '../types';

export interface CSGState {
  baseBrush: Brush;
  cutterBrush: Brush;
  evaluator: Evaluator;
}

export interface ThreeHandle {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  gridHelper: THREE.GridHelper;
  sliceHelper: THREE.Mesh;
  plane: THREE.Mesh;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  objects: THREE.Object3D[];
  examGroup: THREE.Mesh | null;
  csg: CSGState | null;
  animationId: number | null;
  contextLost: boolean;
  onContextLost: ((e: Event) => void) | null;
  onContextRestored: (() => void) | null;
}

export type CameraViewType = 'front' | 'back' | 'left' | 'right' | 'top' | 'iso';

export type { ExamShapeDef };
