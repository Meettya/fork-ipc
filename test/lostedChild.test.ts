/*
 * Test suite for fork-ipc
 */

import { ChildProcess, fork } from 'child_process'
import { join } from 'path'

import { execute as executeType, registerChild as registerChildType } from '../'
import { sleeper } from './utils/sleeper'

const childPath = join(__dirname, 'fixtures')

describe("work with losted child", () => {
  let execute: typeof executeType
  let registerChild: typeof registerChildType
  let child2: ChildProcess

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ForkIpc = require("..")
    execute = ForkIpc.execute
    registerChild = ForkIpc.registerChild
    child2 = fork(`${childPath}/child2.js`)
  })

  afterEach(() => {
    child2.kill()
  })

  test("should reject execute if child killed by parent", async () => {
    expect.assertions(1)
    return await registerChild(child2)
      .then(async () => {
        child2.kill()
        return await execute("example", "add", 2, 3)
      })
      .catch((e) => {
        // eslint-disable-next-line jest/no-conditional-expect
        return expect(e).toBeInstanceOf(Error)
      })
  })

  test("should allow re-register new child if old killed by parent", async () => {
    return await registerChild(child2)
      .then(async () => {
        child2.kill()
        child2 = fork(`${childPath}/child2.js`)
        return await registerChild(child2)
      })
      .then(async () => {
        return await execute("example", "add", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })

  test("should reject execute if child killed by itself", async () => {
    expect.assertions(1)
    const res = registerChild(child2)
      .then(async () => {
        return await execute("example", "doDie")
      })
      .then(sleeper(300))
      .then(async () => {
        return await execute("example", "add", 2, 3)
      })
    await expect(res).rejects.toThrow(Error)
  })

  test("should allow re-register new child if old killed by itself", async () => {
    return await registerChild(child2)
      .then(async () => {
        return await execute("example", "doDie")
      })
      .then(sleeper(300))
      .then(async () => {
        child2 = fork(`${childPath}/child2.js`)
        return await registerChild(child2)
      })
      .then(async () => {
        return await execute("example", "add", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })
})
