const sleeper = (ms) => (x) =>
  new Promise((resolve) => setTimeout(() => resolve(x), ms));

module.exports = {
  sleeper,
};
