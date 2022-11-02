/*
 * Test suite for fork-ipc
 */
import { ChildProcess, fork } from 'child_process'
import { join } from 'path'

import {
    execute as executeType, parent as parentType, registerChild as registerChildType
} from '../'

const childPath = join(__dirname, "fixtures")

describe("as child to parent", () => {
  let parent: typeof parentType
  let execute: typeof executeType
  let registerChild: typeof registerChildType
  let child1: ChildProcess
  let child2: ChildProcess

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ForkIpc = require("..")
    parent = ForkIpc.parent
    execute = ForkIpc.execute
    registerChild = ForkIpc.registerChild

    child1 = fork(`${childPath}/child1.js`)
    child2 = fork(`${childPath}/child2.js`)
  })

  afterEach(() => {
    child1.kill()
    child2.kill()
  })

  test("should send once notification from child to parent", async () => {
    expect.assertions(1)
    const testRes = 10
    const result = new Promise((resolve) => {
      parent.once("emiterBus", (res) => {
        expect(res).toBe(testRes)
        return resolve('valid')
      })
    })

    registerChild(child2).then(
      async () => {
        return await execute("example", "makeEmit", testRes)
      },
      () => { },
    )

    return await result
  })

  test("should send notification from child to parent", async () => {
    expect.assertions(1)
    const testRes = 10
    const result = new Promise((resolve) => {
      parent.on("emiterBus", (res) => {
        expect(res).toBe(testRes)
        return resolve('valid')
      })
    })
    registerChild(child2).then(
      async () => {
        return await execute("example", "makeEmit", testRes)
      },
      () => { })

    return await result
  })

  test("should execute (proxy) service from child to parent", async () => {
    return await registerChild(child1)
      .then(async () => {
        return await registerChild(child2)
      })
      .then(async () => {
        return await parent.allowToChild(child2, { test: ["addAsync"] })
      })
      .then(async () => {
        return await execute("example", "askSibling", 10, 20)
      })
      .then((res) => {
        expect(res).toBe(30)
      })
  })

  test("should execute local service from child to parent", async () => {
    const localFn = async (a: number, b: number): Promise<number> => {
      return await Promise.resolve(a + b)
    }

    return await parent
      .registerLocal("test", { localFn })
      .then(async () => {
        return await registerChild(child2)
      })
      .then(async () => {
        return await parent.allowToChild(child2, { test: ["localFn"] })
      })
      .then(async () => {
        return await execute("example", "askParent", 10, 20)
      })
      .then((res) => {
        expect(res).toBe(30)
      })
  })

  describe("should reject execute service from child to parent", () => {
    test("when no executor registered", async () => {
      expect.assertions(1)

      const res = registerChild(child2)
        .then(async () => {
          return await parent.allowToChild(child2, { test: ["addAsync"] })
        })
        .then(async () => {
          return await execute("example", "askSibling", 10, 20)
        })

      await expect(res).rejects.toThrow(Error)
    })

    test("when execute not allowed", async () => {
      expect.assertions(1)

      const res = registerChild(child1)
        .then(async () => {
          return await registerChild(child2)
        })
        .then(async () => {
          return await parent.allowToChild(child2, { test: ["add"] })
        })
        .then(async () => {
          return await execute("example", "askSibling", 10, 20)
        })

      await expect(res).rejects.toThrow(Error)
    })
  })
})
