/*
 * Test suite for fork-ipc
 */
const { fork } = require("child_process");
const { sleeper } = require("./utils/sleeper");

const childPath = `${__dirname}/fixtures`;

describe("work with losted child", () => {
  let forkIpc, child2;

  beforeEach(() => {
    forkIpc = require("..").default;
    child2 = fork(`${childPath}/child2.js`);
  });

  afterEach(() => {
    child2.kill();
  });

  test("should reject execute if child killed by parent", () => {
    expect.assertions(1);
    return forkIpc.parent
      .registerChild(child2)
      .then(() => {
        child2.kill();
        return forkIpc.parent.execute("example", "add", 2, 3);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });

  test("should allow re-register new child if old killed by parent", () => {
    return forkIpc.parent
      .registerChild(child2)
      .then(() => {
        child2.kill();
        child2 = fork(`${childPath}/child2.js`);
        return forkIpc.parent.registerChild(child2);
      })
      .then(() => {
        return forkIpc.parent.execute("example", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should reject execute if child killed by itself", () => {
    expect.assertions(1);
    return forkIpc.parent
      .registerChild(child2)
      .then(() => {
        return forkIpc.parent.execute("example", "doDie");
      })
      .then(sleeper(300))
      .then(() => {
        return forkIpc.parent.execute("example", "add", 2, 3);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });

  test("should allow re-register new child if old killed by itself", () => {
    return forkIpc.parent
      .registerChild(child2)
      .then(() => {
        return forkIpc.parent.execute("example", "doDie");
      })
      .then(sleeper(300))
      .then(() => {
        child2 = fork(`${childPath}/child2.js`);
        return forkIpc.parent.registerChild(child2);
      })
      .then(() => {
        return forkIpc.parent.execute("example", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });
});
