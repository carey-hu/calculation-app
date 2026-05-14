export const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const rejectSample = <T>(generate: () => T, accept: (v: T) => boolean): T => {
  while (true) {
    const v = generate();
    if (accept(v)) return v;
  }
};

export const genN = <T>(n: number, factory: () => T): T[] => {
  const pool: T[] = [];
  for (let i = 0; i < n; i++) pool.push(factory());
  return pool;
};
