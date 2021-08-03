/*
 * Test suite for fork-ipc
 */
import { ChildProcess, fork } from 'child_process';

import { execute as executeType, registerChild as registerChildType } from '../';

const childPath = `${__dirname}/fixtures`;

describe("as remote service processor", () => {
  let execute: typeof executeType;
  let registerChild: typeof registerChildType;
  let child1: ChildProcess;

  beforeEach(() => {
    const ForkIpc = require("..");
    execute = ForkIpc.execute;
    registerChild = ForkIpc.registerChild;
    child1 = fork(`${childPath}/child1.js`);
  });

  afterEach(() => {
    child1.kill();
  });

  test("should process valid sync service", () => {
    return registerChild(child1)
      .then(() => {
        return execute("test", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should process valid async service", () => {
    return registerChild(child1)
      .then(() => {
        return execute("test", "addAsync", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should process invalid sync service", () => {
    expect.assertions(1);
    return registerChild(child1)
      .then(() => {
        return execute("test", "errorSync", 2, 3);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });

  test("should process invalid async service", () => {
    expect.assertions(1);
    return registerChild(child1)
      .then(() => {
        return execute("test", "errorAsync", 2, 3);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });

  test("should reject nonexistent service", () => {
    expect.assertions(1);
    return registerChild(child1)
      .then(() => {
        return execute("test", "nonexistent", 2, 3);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });
});
