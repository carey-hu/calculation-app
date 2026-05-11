export const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const rejectSample = (generate, accept) => {
  while (true) {
    const v = generate();
    if (accept(v)) return v;
  }
};

export const genN = (n, factory) => {
  const pool = [];
  for (let i = 0; i < n; i++) pool.push(factory());
  return pool;
};
