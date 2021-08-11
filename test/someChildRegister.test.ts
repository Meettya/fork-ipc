/*
 * Test suite for fork-ipc
 */
import { ChildProcess, fork } from 'child_process'
import { join } from 'path'

import { execute as executeType, registerChild as registerChildType } from '../'

const childPath = join(__dirname, "fixtures")

describe("as register services for some child case", () => {
  let execute: typeof executeType
  let registerChild: typeof registerChildType
  let child1: ChildProcess
  let child2: ChildProcess
  let child1Double: ChildProcess

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ForkIpc = require("..")
    execute = ForkIpc.execute
    registerChild = ForkIpc.registerChild
    child1 = fork(`${childPath}/child1.js`)
    child2 = fork(`${childPath}/child2.js`)
    child1Double = fork(`${childPath}/child1.js`)
  })

  afterEach(() => {
    child1.kill()
    child2.kill()
    child1Double.kill()
  })

  test("should register two child with no intersection at services", async () => {
    return await registerChild(child1)
      .then(async () => {
        return await registerChild(child2)
      })
      .then(async () => {
        return await Promise.all([
          execute("test", "add", 2, 3),
          execute("example", "add", 10, 20),
        ])
      })
      .then((res) => {
        expect(res).toStrictEqual([5, 30])
      })
  })

  test("should throw error if services has intersection", async () => {
    expect.assertions(1)

    const res = registerChild(child1)
      .then(async () => {
        return await registerChild(child1Double)
      })

    await expect(res).rejects.toThrow(Error)
  })
})
