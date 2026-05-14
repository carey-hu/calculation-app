declare module 'three-bvh-csg' {
  import type * as THREE from 'three';

  export class Brush {
    geometry: THREE.BufferGeometry;
    material: THREE.Material | THREE.Material[];
    position: THREE.Vector3;
    rotation: THREE.Euler;

    constructor(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[]);
    updateMatrixWorld(): void;
    lookAt(target: THREE.Vector3): void;
  }

  export class Evaluator {
    useGroups: boolean;
    evaluate(
      base: Brush,
      cutter: Brush,
      operation: typeof SUBTRACTION,
    ): THREE.Mesh;
  }

  export const SUBTRACTION: unique symbol;
}
