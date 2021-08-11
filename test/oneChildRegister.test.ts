/*
 * Test suite for fork-ipc
 */
import { ChildProcess, fork } from 'child_process'
import { join } from 'path'

import {
    execute as executeType, parent as parentType, registerChild as registerChildType,
} from '../'
import { sleeper } from './utils/sleeper'

const childPath = join(__dirname, "fixtures")

describe("as register services for one child case", () => {
  let parent: typeof parentType
  let execute: typeof executeType
  let registerChild: typeof registerChildType
  let child1: ChildProcess
  let childDelay: ChildProcess

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ForkIpc = require("..")
    parent = ForkIpc.parent
    execute = ForkIpc.execute
    registerChild = ForkIpc.registerChild

    child1 = fork(`${childPath}/child1.js`)
    childDelay = fork(`${childPath}/child_delay.js`)
  })

  afterEach(() => {
    child1.kill()
    childDelay.kill()
  })

  test("should register one child without any delay", async () => {
    return await registerChild(child1)
      .then(async () => {
        return await execute("test", "add", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })

  test("should register one child with delay on parent and no delay on child", async () => {
    return await Promise.resolve()
      .then(sleeper(500))
      .then(async () => {
        return await registerChild(child1)
      })
      .then(async () => {
        return await execute("test", "add", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })

  test("should register one child without delay on parent and with delay on child", async () => {
    return await registerChild(childDelay)
      .then(async () => {
        return await execute("test", "add", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })

  test("should register one child with delay on parent and with delay on child too", async () => {
    return await Promise.resolve()
      .then(sleeper(600))
      .then(async () => {
        return await registerChild(childDelay)
      })
      .then(async () => {
        return await execute("test", "add", 2, 3)
      })
      .then((res) => {
        expect(res).toBe(5)
      })
  })

  test("should allow acess for child-to-parent part", async () => {
    return await registerChild(child1)
      .then(async () => {
        return await parent.allowToChild(child1, {
          allowed: ["addParent"],
        })
      })
      .then(() => {
        expect(true).toBe(true)
      })
  })
})
