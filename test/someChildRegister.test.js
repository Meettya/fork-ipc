/*
 * Test suite for fork-ipc
 */
const { fork } = require("child_process");

const childPath = `${__dirname}/fixtures`;

describe("as register services for some child case", () => {
  let forkIpc, child1, child2, child1_double;

  beforeEach(() => {
    forkIpc = require("..").default;
    child1 = fork(`${childPath}/child1.js`);
    child2 = fork(`${childPath}/child2.js`);
    child1_double = fork(`${childPath}/child1.js`);
  });

  afterEach(() => {
    child1.kill();
    child2.kill();
    child1_double.kill();
  });

  test("should register two child with no intersection at services", () => {
    return forkIpc.parent
      .registerChild(child1)
      .then(() => {
        return forkIpc.parent.registerChild(child2);
      })
      .then(() => {
        return Promise.all([
          forkIpc.parent.execute("test", "add", 2, 3),
          forkIpc.parent.execute("example", "add", 10, 20),
        ]);
      })
      .then((res) => {
        expect(res).toStrictEqual([5, 30]);
      });
  });

  test("should throw error if services has intersection", () => {
    expect.assertions(1);
    return forkIpc.parent
      .registerChild(child1)
      .then(() => {
        return forkIpc.parent.registerChild(child1_double);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });
});
