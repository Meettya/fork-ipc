/*
 * Parent part for Fork IPC
 */

import { getChild } from './child';
import { ACTIONS, CHANNEL, STATUS } from './constants';
import { processEmited } from './emitter';
import { registerProcessor } from './processor';
import { doRequest, doResponce } from './requests';
import * as Types from './types';
import { isPlainObject } from './utils';

const childrensGrants: Types.ChildrensGrants = {}

/*
 * Register child in parent process
 * actualy subscribe to children messages
 */
export const registerChild = (child: Types.ChildProcess) => {
  return new Promise((resolve, reject) => {
    child.on('message', (message: Types.MessageAny) => {
      // ugly fix for strange bug - at jest for example
      message = { ...message }

      if (isPlainObject(message) && message.channel === CHANNEL) {
        switch (message.type) {
          case ACTIONS.REGISTER:
            registerProcessor(child, message, resolve, reject)
            break
          case ACTIONS.RESULT:
            doResponce(message)
            break
          case ACTIONS.EMIT:
            processEmited(message)
            break
          case ACTIONS.PROXY_EXECUTE:
            proxyExecuteOnParent(message)
            break
          default:
            console.log(`Unhandled message type |${message.type}| ignored!`)
            console.log(message)
        }
      }
    })
    // ask child to do register
    child.send({
      channel: CHANNEL,
      type: ACTIONS.ASK_REGISTER
    })
  })
}

/*
 * Register all allowed to call at parent from child services
 * Save it as object, to speed up check phase
 */
export const allowToChild = (child: Types.ChildProcess, options: Types.GrantOptions) => {
  const childId = child.pid

  return new Promise((resolve, reject) => {
    if (!isPlainObject(options)) {
      return reject(Error('Grant options are misstyped, MUST be an object!'))
    }

    if (!childId) {
      return reject(Error('Grant error, |childId| is undefined!'))
    }

    if (!isPlainObject(childrensGrants[childId])) {
      childrensGrants[childId] = {}
      for (const domain in options) {
        if (options.hasOwnProperty(domain)) {
          const services = options[domain]

          if (!isPlainObject(childrensGrants[childId][domain])) {
            childrensGrants[childId][domain] = {}
          }
          for (const service of services) {
            childrensGrants[childId][domain][service] = true
          }
        }
      }
    }
    resolve('granted!')
  })
}

/*
 * Process proxy execute on parent by child
 */
export const proxyExecuteOnParent = (message: Types.MessageAny) => {
  let child = getChild(message.pid)

  // for registered service only
  if (childrensGrants[message.pid] && childrensGrants[message.pid][message.domain] && childrensGrants[message.pid][message.domain][message.command]) {
    doRequest(message.domain, message.command, ...message.args)
      .then((result) => {
        child.send({
          result,
          channel: CHANNEL,
          id: message.id,
          status: STATUS.OK,
          type: ACTIONS.PROXY_RESULT
        })
      })
      .catch((error) => {
        // transform error from object to text
        if (error instanceof Error) {
          error = error.message
        }
        child.send({
          error,
          channel: CHANNEL,
          id: message.id,
          status: STATUS.FAIL,
          type: ACTIONS.PROXY_RESULT
        })
      })
  } else {
    child.send({
      channel: CHANNEL,
      error: 'Cant execute or not granted, reject!',
      id: message.id,
      status: STATUS.FAIL,
      type: ACTIONS.PROXY_RESULT
    })
  }
}

/*
 * For diagnostic
 */
export const getChildrensGrants = () => childrensGrants
