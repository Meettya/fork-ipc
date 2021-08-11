export const sleeper = (ms: number) => async (x: any) =>
  await new Promise((resolve) => setTimeout(() => resolve(x), ms))
