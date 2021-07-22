/*
 * Test suite for fork-ipc
 */
const { fork } = require("child_process");

const childPath = `${__dirname}/fixtures`;

describe("as register services for some child case", () => {
  let execute, registerChild, child1, child2, child1_double;

  beforeEach(() => {
    const ForkIpc = require("..");
    execute = ForkIpc.execute;
    registerChild = ForkIpc.registerChild;
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
    return registerChild(child1)
      .then(() => {
        return registerChild(child2);
      })
      .then(() => {
        return Promise.all([
          execute("test", "add", 2, 3),
          execute("example", "add", 10, 20),
        ]);
      })
      .then((res) => {
        expect(res).toStrictEqual([5, 30]);
      });
  });

  test("should throw error if services has intersection", () => {
    expect.assertions(1);
    return registerChild(child1)
      .then(() => {
        return registerChild(child1_double);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });
});
