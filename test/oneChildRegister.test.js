/*
 * Test suite for fork-ipc
 */
const { fork } = require("child_process");
const { sleeper } = require("./utils/sleeper");

const childPath = `${__dirname}/fixtures`;

describe("as register services for one child case", () => {
  let forkIpc, child1, childDelay;

  beforeEach(() => {
    forkIpc = require("..").default;
    child1 = fork(`${childPath}/child1.js`);
    childDelay = fork(`${childPath}/child_delay.js`);
  });

  afterEach(() => {
    child1.kill();
    childDelay.kill();
  });

  test("should register one child without any delay", () => {
    return forkIpc.parent
      .registerChild(child1)
      .then(() => {
        return forkIpc.parent.execute("test", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should register one child with delay on parent and no delay on child", () => {
    return Promise.resolve()
      .then(sleeper(500))
      .then(() => {
        return forkIpc.parent.registerChild(child1);
      })
      .then(() => {
        return forkIpc.parent.execute("test", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should register one child without delay on parent and with delay on child", () => {
    return forkIpc.parent
      .registerChild(childDelay)
      .then(() => {
        return forkIpc.parent.execute("test", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should register one child with delay on parent and with delay on child too", () => {
    return Promise.resolve()
      .then(sleeper(600))
      .then(() => {
        return forkIpc.parent.registerChild(childDelay);
      })
      .then(() => {
        return forkIpc.parent.execute("test", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should allow acess for child-to-parent part", () => {
    return forkIpc.parent
      .registerChild(child1)
      .then(() => {
        return forkIpc.parent.allowToChild(child1, {
          allowed: ["addParent"],
        });
      })
      .then(() => {
        expect(true).toBe(true);
      });
  });
});
