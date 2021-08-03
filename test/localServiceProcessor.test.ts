/*
 * Test suite for fork-ipc
 */
import { execute as executeType, parent as parentType } from '../';

describe("as registered local (at parent) services", () => {
  let parent: typeof parentType;
  let execute: typeof executeType;

  beforeEach(() => {
    const ForkIpc = require("..");
    execute = ForkIpc.execute;
    parent = ForkIpc.parent;
  });

  test("should register local service", () => {
    expect.assertions(1);
    const localFn = () => { };

    return parent.registerLocal("test", { localFn: localFn }).then(() => {
      expect(true).toBe(true);
    });
  });

  test("should rejected local service registration if not function", () => {
    expect.assertions(1);
    // @ts-expect-error: should hightlite localFn
    return parent.registerLocal("test", { localFn: "fake" }).catch((e) => {
      return expect(e).toBeInstanceOf(Error);
    });
  });

  test("should execute local service localy", () => {
    const localFn = (a: number, b: number) => {
      return Promise.resolve(a + b);
    };

    return parent
      .registerLocal("test", { localFn: localFn })
      .then(() => {
        return execute("test", "localFn", 2, 3);
      })
      .then((res) => {
        expect(res).toBe(5);
      });
  });
});
