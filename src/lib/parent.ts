/*
 * Parent part for Fork IPC
 */

import { getChild } from '@Lib/child'
import { ACTIONS, CHANNEL, STATUS } from '@Lib/constants'
import { processEmited } from '@Lib/emitter'
import { registerProcessor } from '@Lib/processor'
import { doRequest, doResponce } from '@Lib/requests'
import { isPlainObject } from '@Lib/utils'
import * as Types from '@Types/common'
import * as Message from '@Types/message'

const childrensGrants: Types.ChildrensGrants = {}

/*
 * Register child in parent process
 * actualy subscribe to children messages
 */
export const registerChild = async (child: Types.ChildProcess): Promise<unknown> => {
  return await new Promise((resolve, reject) => {
    child.on('message', (message: Message.Register | Message.ResultKnown | Message.Emit | Message.ProxyExecute) => {
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
            // @ts-expect-error: Its only for unknown messages
            console.log(`Unhandled message type |${String(message.type)}| ignored!`)
            console.log(message)
        }
      }
    })
    // ask child to do register
    const msg: Message.AskRegister = {
      channel: CHANNEL,
      type: ACTIONS.ASK_REGISTER,
    }

    child.send(msg)
  })
}

/*
 * Register all allowed to call at parent from child services
 * Save it as object, to speed up check phase
 */
export const allowToChild = async (child: Types.ChildProcess, options: Types.GrantOptions): Promise<unknown> => {
  const childId = child.pid

  return await new Promise((resolve, reject) => {
    if (!isPlainObject(options)) {
      return reject(Error('Grant options are misstyped, MUST be an object!'))
    }

    if (childId == null) {
      return reject(Error('Grant error, |childId| is undefined!'))
    }

    if (!isPlainObject(childrensGrants[childId])) {
      childrensGrants[childId] = {}
      for (const domain in options) {
        if (Object.prototype.hasOwnProperty.call(options, domain)) {
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

    return resolve('granted!')
  })
}

/*
 * Process proxy execute on parent by child
 */
export const proxyExecuteOnParent = (message: Message.ProxyExecute): void => {
  const child = getChild(message.pid)

  // for registered service only
  if (childrensGrants?.[message.pid]?.[message.domain]?.[message.command]) {
    doRequest(message.domain, message.command, ...message.args)
      .then((result) => {
        const msg: Message.ProxyResultOk = {
          channel: CHANNEL,
          id: message.id,
          result,
          status: STATUS.OK,
          type: ACTIONS.PROXY_RESULT,
        }

        child.send(msg)
      })
      .catch((error) => {
        // transform error from object to text
        if (error instanceof Error) {
          error = error.message
        }
        const msg: Message.ProxyResultFail = {
          channel: CHANNEL,
          error,
          id: message.id,
          status: STATUS.FAIL,
          type: ACTIONS.PROXY_RESULT,
        }

        child.send(msg)
      })
  } else {
    const msg: Message.ProxyResultFail = {
      channel: CHANNEL,
      error: 'Cant execute or not granted, reject!',
      id: message.id,
      status: STATUS.FAIL,
      type: ACTIONS.PROXY_RESULT,
    }

    child.send(msg)
  }
}

/*
 * For diagnostic
 */
export const getChildrensGrants = (): Types.ChildrensGrants => childrensGrants
