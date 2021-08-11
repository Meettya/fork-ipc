/*
 * Test suite for fork-ipc
 */
import { ChildProcess, fork } from 'child_process'
import { join } from 'path'

import { execute as executeType, registerChild as registerChildType } from '../'

const childPath = join(__dirname, "fixtures")

describe("as remote service processor", () => {
  let execute: typeof executeType
  let registerChild: typeof registerChildType
  let child1: ChildProcess

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ForkIpc = require("..")
    execute = ForkIpc.execute
    registerChild = ForkIpc.registerChild
    child1 = fork(`${childPath}/child1.js`)
  })

  afterEach(() => {
    child1.kill()
  })

  test("should process valid sync service", async () => {
    return await registerChild(child1)
      .then(async () => {
        return await execute("test", "add", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })

  test("should process valid async service", async () => {
    return await registerChild(child1)
      .then(async () => {
        return await execute("test", "addAsync", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })

  test("should process invalid sync service", async () => {
    expect.assertions(1)
    const res = registerChild(child1)
      .then(async () => {
        return await execute("test", "errorSync", 2, 3)
      })
    await expect(res).rejects.toThrow(Error)
  })

  test("should process invalid async service", async () => {
    expect.assertions(1)
    const res = registerChild(child1)
      .then(async () => {
        return await execute("test", "errorAsync", 2, 3)
      })

    await expect(res).rejects.toThrow(Error)
  })

  test("should reject nonexistent service", async () => {
    expect.assertions(1)

    const res = registerChild(child1)
      .then(async () => {
        return await execute("test", "nonexistent", 2, 3)
      })

    await expect(res).rejects.toThrow(Error)
  })
})
