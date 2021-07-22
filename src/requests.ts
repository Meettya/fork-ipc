/*
 * Request functional for Fork IPC
 */

import { getChild } from './child';
import { ACTIONS, CHANNEL, STATUS } from './constants';
import { tryGetLocalProcessor } from './localProcessor';
import { getChildId } from './processor';
import * as Types from './types';
import { getID, promiseTry } from './utils';

const requestQueue: Types.RequestQueue = {}

/*
 * Make request to service, will return promise
 */
export const doRequest = (domain: Types.Domain, command: Types.Command, ...args: any[]) => {
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

        setRequestToQueue(id, resolve)
        child.send({
          args,
          command,
          domain,
          id,
          channel: CHANNEL,
          type: ACTIONS.EXECUTE
        })
      }
    }
  })
}

/*
 * Send request result to parent
 */
export const doResponce = (message: Types.MessageAny) => {
  if (requestQueue[message.id]) {
    if (message.status === STATUS.OK) {
      requestQueue[message.id](message.result)
    } else if (message.status === STATUS.FAIL) {
      requestQueue[message.id](Promise.reject(Error(message.error)))
    } else {
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
