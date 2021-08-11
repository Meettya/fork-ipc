/*
 * Request functional for Fork IPC
 */

import { getChild } from '@Lib/child'
import { ACTIONS, CHANNEL, STATUS } from '@Lib/constants'
import { tryGetLocalProcessor } from '@Lib/localProcessor'
import { getChildId } from '@Lib/processor'
import { getID, promiseTry } from '@Lib/utils'
import * as Types from '@Types/common'
import * as Message from '@Types/message'

const requestQueue: Types.RequestQueue = {}

/*
 * Make request to service, will return promise
 */
export const doRequest = async <T extends (...args: any) => any>
  (domain: Types.Domain, command: Types.Command, ...args: Parameters<T>): Promise<ReturnType<T>> => {
  let child: Types.ChildProcess
  const localProcessor = tryGetLocalProcessor(domain, command)

  // if exist local processor - execute it
  if (typeof localProcessor === 'function') {
    const result = await promiseTry(() => {
      return localProcessor(...args as Types.Args)
    })

    return result as ReturnType<T>
  }

  const childId = getChildId(domain, command)
  if (childId != null) {
    child = getChild(childId)
  }

  return await new Promise((resolve, reject) => {
    if (child == null) {
      reject(Error(`Not supported - domain |${domain}|, command |${command}|, rejected!`))
    } else {
      if (child.killed || child.exitCode !== null) {
        reject(Error(`Child died, cant execute domain |${domain}|, command |${command}|, rejected!`))
      } else {
        const id = getID('parent')
        const msg: Message.Execute = {
          args,
          channel: CHANNEL,
          command,
          domain,
          id,
          type: ACTIONS.EXECUTE,
        }

        setRequestToQueue(id, resolve as ReturnType<T>)
        child.send(msg)
      }
    }
  })
}

/*
 * Send request result to parent
 */
export const doResponce = (message: Message.ResultKnown | Message.ProxyResultKnown): void => {
  if (requestQueue[message.id] != null) {
    if (message.status === STATUS.OK) {
      requestQueue[message.id](message.result)
    } else if (message.status === STATUS.FAIL) {
      requestQueue[message.id](Promise.reject(Error(message.error)))
    } else {
      // @ts-expect-error: Its only for unknown messages
      requestQueue[message.id](Promise.reject(Error(`unknown status |${String(message.status)}|`)))
    }
  }
}

/*
 * Set request to queue
 */
export const setRequestToQueue = (id: Types.RequestId, resolve: Types.Resolve): void => {
  requestQueue[id] = resolve
}

/*
 * For diagnostic
 */
export const getRequestQueue = (): Types.RequestQueue => requestQueue
