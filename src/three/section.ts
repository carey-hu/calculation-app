import * as THREE from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import type { ThreeHandle } from './types';
import type { SliceConfig, ExamShapeDef } from '../types';

const sliceNormal = (sliceConfig: SliceConfig): THREE.Vector3 => {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(sliceConfig.rotX),
    THREE.MathUtils.degToRad(sliceConfig.rotY),
    THREE.MathUtils.degToRad(sliceConfig.rotZ),
  );
  return new THREE.Vector3(0, -1, 0).applyEuler(euler).normalize();
};

export const loadShape = (handle: ThreeHandle, shapeConf: ExamShapeDef): void => {
  const baseGeometry = shapeConf.create();
  baseGeometry.computeBoundingBox();
  baseGeometry.center();

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });

  const baseBrush = new Brush(baseGeometry, baseMaterial);
  const cutterBrush = new Brush(
    new THREE.BoxGeometry(50, 50, 50),
    new THREE.MeshBasicMaterial({ color: 0x111111 }),
  );

  const evaluator = new Evaluator();
  evaluator.useGroups = true;

  handle.csg = { baseBrush, cutterBrush, evaluator };
};

export const updateSlice = (handle: ThreeHandle, sliceConfig: SliceConfig): void => {
  if (!handle.csg || !handle.scene) return;
  const { baseBrush, cutterBrush, evaluator } = handle.csg;
  const { constant } = sliceConfig;

  cutterBrush.position.set(0, 0, 0);
  cutterBrush.rotation.set(0, 0, 0);
  cutterBrush.updateMatrixWorld();

  const normal = sliceNormal(sliceConfig);
  const cutterSize = 25;
  const offset = normal.clone().multiplyScalar(constant - cutterSize);

  cutterBrush.position.copy(offset);
  cutterBrush.lookAt(offset.clone().add(normal));
  cutterBrush.updateMatrixWorld();
  baseBrush.updateMatrixWorld();

  const resultMesh = evaluator.evaluate(baseBrush, cutterBrush, SUBTRACTION);
  (resultMesh as THREE.Mesh).material = [baseBrush.material, cutterBrush.material] as unknown as THREE.Material;

  if (handle.examGroup) {
    handle.scene.remove(handle.examGroup);
    if (handle.examGroup.geometry) handle.examGroup.geometry.dispose();
  }
  handle.examGroup = resultMesh;
  handle.scene.add(resultMesh);

  if (handle.sliceHelper) {
    const helper = handle.sliceHelper;
    helper.visible = true;
    const planePos = normal.clone().multiplyScalar(constant);
    helper.position.copy(planePos);
    helper.lookAt(planePos.clone().add(normal));
  }
};

export const lookAtSection = (handle: ThreeHandle, sliceConfig: SliceConfig): void => {
  if (!handle.controls || !handle.camera) return;
  const normal = sliceNormal(sliceConfig);
  const target = handle.controls.target.clone();
  const dist = 20;
  const eyePos = target.clone().add(normal.multiplyScalar(-dist));
  handle.camera.position.copy(eyePos);
  handle.camera.lookAt(target);
  handle.controls.update();
};
