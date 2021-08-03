/*
 * Test suite for fork-ipc
 */
import { ChildProcess, fork } from 'child_process';

import {
    execute as executeType, parent as parentType, registerChild as registerChildType
} from '../';

const childPath = `${__dirname}/fixtures`;

describe("as child to parent", () => {
  let parent: typeof parentType;
  let execute: typeof executeType;
  let registerChild: typeof registerChildType;
  let child1: ChildProcess;
  let child2: ChildProcess;

  beforeEach(() => {
    const ForkIpc = require("..");
    parent = ForkIpc.parent;
    execute = ForkIpc.execute;
    registerChild = ForkIpc.registerChild;

    child1 = fork(`${childPath}/child1.js`);
    child2 = fork(`${childPath}/child2.js`);
  });

  afterEach(() => {
    child1.kill();
    child2.kill();
  });

  test("should send once notification from child to parent", (done) => {
    expect.assertions(1);
    const testRes = 10;
    parent.once("emiterBus", (res) => {
      expect(res).toBe(testRes);
      done();
    });
    registerChild(child2).then(() => {
      execute("example", "makeEmit", testRes);
    });
  });

  test("should send notification from child to parent", (done) => {
    expect.assertions(1);
    const testRes = 10;
    parent.on("emiterBus", (res) => {
      expect(res).toBe(testRes);
      done();
    });
    registerChild(child2).then(() => {
      execute("example", "makeEmit", testRes);
    });
  });

  test("should execute (proxy) service from child to parent", () => {
    return registerChild(child1)
      .then(() => {
        return registerChild(child2);
      })
      .then(() => {
        return parent.allowToChild(child2, { test: ["addAsync"] });
      })
      .then(() => {
        return execute("example", "askSibling", 10, 20);
      })
      .then((res) => {
        expect(res).toBe(30);
      });
  });

  test("should execute local service from child to parent", () => {
    const localFn = (a: number, b: number) => {
      return Promise.resolve(a + b);
    };

    return parent
      .registerLocal("test", { localFn: localFn })
      .then(() => {
        return registerChild(child2);
      })
      .then(() => {
        return parent.allowToChild(child2, { test: ["localFn"] });
      })
      .then(() => {
        return execute("example", "askParent", 10, 20);
      })
      .then((res) => {
        expect(res).toBe(30);
      });
  });

  describe("should reject execute service from child to parent", () => {
    test("when no executor registered", () => {
      expect.assertions(1);
      return registerChild(child2)
        .then(() => {
          return parent.allowToChild(child2, { test: ["addAsync"] });
        })
        .then(() => {
          return execute("example", "askSibling", 10, 20);
        })
        .catch((e) => {
          return expect(e).toBeInstanceOf(Error);
        });
    });

    test("when execute not allowed", () => {
      expect.assertions(1);
      return registerChild(child1)
        .then(() => {
          return registerChild(child2);
        })
        .then(() => {
          return parent.allowToChild(child2, { test: ["add"] });
        })
        .then(() => {
          return execute("example", "askSibling", 10, 20);
        })
        .catch((e) => {
          return expect(e).toBeInstanceOf(Error);
        });
    });
  });
});
