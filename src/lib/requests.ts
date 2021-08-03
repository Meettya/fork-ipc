/*
 * Request functional for Fork IPC
 */

import { getChild } from '@Lib/child';
import { ACTIONS, CHANNEL, STATUS } from '@Lib/constants';
import { tryGetLocalProcessor } from '@Lib/localProcessor';
import { getChildId } from '@Lib/processor';
import { getID, promiseTry } from '@Lib/utils';
import * as Types from '@Types/common';
import * as Message from '@Types/message';

const requestQueue: Types.RequestQueue = {}

/*
 * Make request to service, will return promise
 */
export const doRequest = (domain: Types.Domain, command: Types.Command, ...args: Types.Args) => {
  let child: Types.ChildProcess
  const localProcessor = tryGetLocalProcessor(domain, command)

  // if exist local processor - execute it
  if (typeof localProcessor === 'function') {
    return promiseTry(() => {
      return localProcessor(...args)
    })
  }

  let childId = getChildId(domain, command)
  if (childId) {
    child = getChild(childId)
  }

  return new Promise((resolve, reject) => {
    if (!child) {
      reject(Error(`Not supported - domain |${domain}|, command |${command}|, rejected!`))
    } else {
      if (child.killed || child.exitCode !== null) {
        reject(Error(`Child died, cant execute domain |${domain}|, command |${command}|, rejected!`))
      } else {
        const id = getID('parent')
        const msg: Message.Execute = {
          args,
          command,
          domain,
          id,
          channel: CHANNEL,
          type: ACTIONS.EXECUTE
        }

        setRequestToQueue(id, resolve)
        child.send(msg)
      }
    }
  })
}

/*
 * Send request result to parent
 */
export const doResponce = (message: Message.ResultKnown | Message.ProxyResultKnown) => {
  if (requestQueue[message.id]) {
    if (message.status === STATUS.OK) {
      requestQueue[message.id](message.result)
    } else if (message.status === STATUS.FAIL) {
      requestQueue[message.id](Promise.reject(Error(message.error)))
    } else {
      // @ts-expect-error: Its only for unknown messages
      requestQueue[message.id](Promise.reject(Error(`unknown status |${message.status}|`)))
    }
  }
}

/*
 * Set request to queue
 */
export const setRequestToQueue = (id: Types.RequestId, resolve: Types.Resolve) => {
  requestQueue[id] = resolve
}

/*
 * For diagnostic
 */
export const getRequestQueue = () => requestQueue
