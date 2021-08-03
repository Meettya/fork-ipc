/*
 * Test suite for fork-ipc
 */

import { ChildProcess, fork } from 'child_process';

import { execute as executeType, registerChild as registerChildType } from '../';
import { sleeper } from './utils/sleeper';

const childPath = `${__dirname}/fixtures`;

describe("work with losted child", () => {
  let execute: typeof executeType;
  let registerChild: typeof registerChildType;
  let child2: ChildProcess;

  beforeEach(() => {
    const ForkIpc = require("..");
    execute = ForkIpc.execute;
    registerChild = ForkIpc.registerChild;
    child2 = fork(`${childPath}/child2.js`);
  });

  afterEach(() => {
    child2.kill();
  });

  test("should reject execute if child killed by parent", () => {
    expect.assertions(1);
    return registerChild(child2)
      .then(() => {
        child2.kill();
        return execute("example", "add", 2, 3);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });

  test("should allow re-register new child if old killed by parent", () => {
    return registerChild(child2)
      .then(() => {
        child2.kill();
        child2 = fork(`${childPath}/child2.js`);
        return registerChild(child2);
      })
      .then(() => {
        return execute("example", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });

  test("should reject execute if child killed by itself", () => {
    expect.assertions(1);
    return registerChild(child2)
      .then(() => {
        return execute("example", "doDie");
      })
      .then(sleeper(300))
      .then(() => {
        return execute("example", "add", 2, 3);
      })
      .catch((e) => {
        return expect(e).toBeInstanceOf(Error);
      });
  });

  test("should allow re-register new child if old killed by itself", () => {
    return registerChild(child2)
      .then(() => {
        return execute("example", "doDie");
      })
      .then(sleeper(300))
      .then(() => {
        child2 = fork(`${childPath}/child2.js`);
        return registerChild(child2);
      })
      .then(() => {
        return execute("example", "add", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });
});
