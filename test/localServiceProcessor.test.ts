/*
 * Test suite for fork-ipc
 */
import { execute as executeType, parent as parentType } from '../'

describe("as registered local (at parent) services", () => {
  let parent: typeof parentType
  let execute: typeof executeType

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ForkIpc = require("..")
    execute = ForkIpc.execute
    parent = ForkIpc.parent
  })

  test("should register local service", async () => {
    expect.assertions(1)
    const localFn = (): void => { }

    return await parent.registerLocal("test", { localFn }).then(() => {
      expect(true).toBe(true)
    })
  })

  test("should rejected local service registration if not function", async () => {
    expect.assertions(1)
    // @ts-expect-error: should hightlite localFn
    const res = parent.registerLocal("test", { localFn: "fake" })

    await expect(res).rejects.toThrow(Error)
  })

  test("should execute local service localy", async () => {
    const localFn = async (a: number, b: number): Promise<number> => {
      return await Promise.resolve(a + b)
    }

    return await parent
      .registerLocal("test", { localFn })
      .then(async () => {
        return await execute("test", "localFn", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })
})
