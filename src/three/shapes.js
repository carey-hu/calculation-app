import * as THREE from 'three';

const extrude = (shape, opts) => new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, ...opts });

const createHollowCylinder = () => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 4, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 2, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return extrude(shape, { depth: 8, curveSegments: 64 });
};

const createHollowPrism = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-4, -4);
  shape.lineTo(4, -4); shape.lineTo(4, 4); shape.lineTo(-4, 4); shape.lineTo(-4, -4);
  const hole = new THREE.Path();
  hole.moveTo(-2, -2); hole.lineTo(-2, 2); hole.lineTo(2, 2); hole.lineTo(2, -2); hole.lineTo(-2, -2);
  shape.holes.push(hole);
  return extrude(shape, { depth: 8 });
};

const createFrameShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-4, -4); shape.lineTo(4, -4); shape.lineTo(4, 4); shape.lineTo(-4, 4); shape.lineTo(-4, -4);
  const hole = new THREE.Path();
  hole.moveTo(-3, -3); hole.lineTo(-3, 3); hole.lineTo(3, 3); hole.lineTo(3, -3); hole.lineTo(-3, -3);
  shape.holes.push(hole);
  return extrude(shape, { depth: 2 });
};

const createUShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-3, -3); shape.lineTo(3, -3); shape.lineTo(3, 3);
  shape.lineTo(1, 3); shape.lineTo(1, -1); shape.lineTo(-1, -1);
  shape.lineTo(-1, 3); shape.lineTo(-3, 3); shape.lineTo(-3, -3);
  return extrude(shape, { depth: 6 });
};

const createLShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(4, 0); shape.lineTo(4, 2);
  shape.lineTo(2, 2); shape.lineTo(2, 6); shape.lineTo(0, 6); shape.lineTo(0, 0);
  return extrude(shape, { depth: 4 });
};

const createCrossShape = () => {
  const shape = new THREE.Shape();
  const w = 2;
  const l = 6;
  shape.moveTo(-w / 2, -l / 2);
  shape.lineTo(w / 2, -l / 2); shape.lineTo(w / 2, -w / 2);
  shape.lineTo(l / 2, -w / 2); shape.lineTo(l / 2, w / 2);
  shape.lineTo(w / 2, w / 2); shape.lineTo(w / 2, l / 2);
  shape.lineTo(-w / 2, l / 2); shape.lineTo(-w / 2, w / 2);
  shape.lineTo(-l / 2, w / 2); shape.lineTo(-l / 2, -w / 2);
  shape.lineTo(-w / 2, -w / 2);
  return extrude(shape, { depth: 2 });
};

const createNotchedCube = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-3, -3); shape.lineTo(3, -3); shape.lineTo(3, 1);
  shape.lineTo(1, 3); shape.lineTo(-3, 3);
  return extrude(shape, { depth: 6 });
};

const createTShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-1.5, -4); shape.lineTo(1.5, -4); shape.lineTo(1.5, 2);
  shape.lineTo(4, 2); shape.lineTo(4, 4); shape.lineTo(-4, 4);
  shape.lineTo(-4, 2); shape.lineTo(-1.5, 2); shape.lineTo(-1.5, -4);
  return extrude(shape, { depth: 3 });
};

const createCubeWithHole = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-3, -3); shape.lineTo(3, -3); shape.lineTo(3, 3); shape.lineTo(-3, 3);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 2, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return extrude(shape, { depth: 6, curveSegments: 64 });
};

const createCylinderWithRectHole = () => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 4, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.moveTo(-1.5, -1.5); hole.lineTo(-1.5, 1.5); hole.lineTo(1.5, 1.5);
  hole.lineTo(1.5, -1.5); hole.lineTo(-1.5, -1.5);
  shape.holes.push(hole);
  return extrude(shape, { depth: 8, curveSegments: 64 });
};

const createArchShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-3, 0); shape.lineTo(3, 0); shape.lineTo(3, 4);
  shape.absarc(0, 4, 3, 0, Math.PI, false);
  shape.lineTo(-3, 4);
  const hole = new THREE.Path();
  hole.moveTo(-1.5, 0); hole.lineTo(-1.5, 3);
  hole.absarc(0, 3, 1.5, Math.PI, 0, true);
  hole.lineTo(1.5, 0); hole.lineTo(-1.5, 0);
  shape.holes.push(hole);
  return extrude(shape, { depth: 2, curveSegments: 32 });
};

const createTrapezoidPrism = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-4, -2); shape.lineTo(4, -2); shape.lineTo(2, 2);
  shape.lineTo(-2, 2); shape.lineTo(-4, -2);
  return extrude(shape, { depth: 8 });
};

const createSemiCylinder = () => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 4, 0, Math.PI, false);
  shape.lineTo(-4, 0);
  return extrude(shape, { depth: 8, curveSegments: 32 });
};

const createSectorPrism = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(4, 0);
  shape.absarc(0, 0, 4, 0, Math.PI / 2, false);
  shape.lineTo(0, 0);
  return extrude(shape, { depth: 6, curveSegments: 32 });
};

const createTwoHoleBrick = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-4, -2); shape.lineTo(4, -2); shape.lineTo(4, 2);
  shape.lineTo(-4, 2); shape.lineTo(-4, -2);
  const h1 = new THREE.Path();
  h1.absarc(-2, 0, 1, 0, Math.PI * 2, true);
  shape.holes.push(h1);
  const h2 = new THREE.Path();
  h2.absarc(2, 0, 1, 0, Math.PI * 2, true);
  shape.holes.push(h2);
  return extrude(shape, { depth: 4, curveSegments: 32 });
};

const createStaircase = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-3, -3);
  shape.lineTo(3, -3); shape.lineTo(3, -1);
  shape.lineTo(1, -1); shape.lineTo(1, 1);
  shape.lineTo(-1, 1); shape.lineTo(-1, 3);
  shape.lineTo(-3, 3);
  return extrude(shape, { depth: 4 });
};

export const EXAM_SHAPES = {
  basic: [
    { name: '正方体', create: () => new THREE.BoxGeometry(6, 6, 6) },
    { name: '长方体(扁)', create: () => new THREE.BoxGeometry(4, 8, 2) },
    { name: '圆柱', create: () => new THREE.CylinderGeometry(4, 4, 8, 32) },
    { name: '三棱柱', create: () => new THREE.CylinderGeometry(4, 4, 8, 3) },
    { name: '六棱柱', create: () => new THREE.CylinderGeometry(4, 4, 8, 6) },
    { name: '梯形柱', create: createTrapezoidPrism },
    { name: '半圆柱', create: createSemiCylinder },
    { name: '正四面体', create: () => new THREE.TetrahedronGeometry(6) },
    { name: '正八面体', create: () => new THREE.OctahedronGeometry(5) },
  ],
  curved: [
    { name: '圆锥', create: () => new THREE.CylinderGeometry(0, 4, 8, 64) },
    { name: '圆台', create: () => new THREE.CylinderGeometry(2, 4, 6, 64) },
    { name: '球体', create: () => new THREE.SphereGeometry(4, 64, 64) },
    { name: '半球', create: () => new THREE.SphereGeometry(4, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2) },
    { name: '扇形柱(1/4圆)', create: createSectorPrism },
  ],
  hollow: [
    { name: '空心圆柱(圆管)', create: createHollowCylinder },
    { name: '空心方柱(方管)', create: createHollowPrism },
    { name: '回字型(框体)', create: createFrameShape },
    { name: '正方体挖圆孔', create: createCubeWithHole },
    { name: '圆柱挖方孔', create: createCylinderWithRectHole },
    { name: '双孔砖', create: createTwoHoleBrick },
  ],
  composite: [
    { name: 'T型体', create: createTShape },
    { name: 'L型体', create: createLShape },
    { name: '十字体', create: createCrossShape },
    { name: '凹型体(U型)', create: createUShape },
    { name: '拱门造型', create: createArchShape },
  ],
  special: [
    { name: '缺角正方体', create: createNotchedCube },
    { name: '台阶(阶梯)', create: createStaircase },
    { name: '三角楔形', create: () => new THREE.CylinderGeometry(0, 4, 6, 3, 1, false, 0, Math.PI) },
    { name: '四棱锥', create: () => new THREE.CylinderGeometry(0, 5, 6, 4) },
  ],
};
