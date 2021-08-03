export const sleeper = (ms: number) => (x: any) =>
  new Promise((resolve) => setTimeout(() => resolve(x), ms));
