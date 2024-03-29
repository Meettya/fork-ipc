/*
 * Child functional for Fork IPC
 */

import { ACTIONS, CHANNEL, STATUS } from '@Lib/constants'
import { doResponce, setRequestToQueue } from '@Lib/requests'
import { getID, isPlainObject, promiseTry } from '@Lib/utils'
import * as Types from '@Types/common'
import * as Message from '@Types/message'

const childrens: Types.Childrens = {}

/*
 * Announce supported services in domain into child proc
 * as is AND set listener to parent AND send message to parent
 */
export const servicesAnnouncement = (domain: Types.Domain, services: Types.LocalServices): void => {
  const childRegister = (): void => {
    const msg: Message.Register = {
      channel: CHANNEL,
      domain,
      pid: process.pid,
      services: Object.keys(services),
      type: ACTIONS.REGISTER,
    }

    process.send?.(msg)
  }

  process.on('message', (message: Message.AskRegister | Message.Execute | Message.ProxyResultKnown) => {
    if (isPlainObject(message) && message.channel === CHANNEL) {
      switch (message.type) {
        case ACTIONS.ASK_REGISTER:
          childRegister()
          break
        case ACTIONS.EXECUTE:
          executeOnChild(domain, services, message)
            .then((result) => {
              const msg: Message.ResultOk = {
                channel: CHANNEL,
                id: message.id,
                result,
                status: STATUS.OK,
                type: ACTIONS.RESULT,
              }

              process.send?.(msg)
            })
            .catch((error) => {
              // transform error from object to text
              if (error instanceof Error) {
                error = error.message
              }
              const msg: Message.ResultFail = {
                channel: CHANNEL,
                error,
                id: message.id,
                status: STATUS.FAIL,
                type: ACTIONS.RESULT,
              }

              process.send?.(msg)
            })
          break
        case ACTIONS.PROXY_RESULT:
          doResponce(message)
          break
        default:
          console.log(`Child ${process.argv[1]} unknown message`)
          console.log(message)
      }
    }
  })
  // in case its late
  childRegister()
}

/*
 * Execute via parent request by child
 * service(function) may be routed by parent to another child or announced by parent inself
 */
export const executeViaParent = async <T extends (...args: any) => any>
  (domain: Types.Domain, command: Types.Command, ...args: Parameters<T>): Promise<ReturnType<T>> => {
  const id = getID('child')

  return await new Promise((resolve) => {
    const msg: Message.ProxyExecute = {
      args,
      channel: CHANNEL,
      command,
      domain,
      id,
      pid: process.pid,
      type: ACTIONS.PROXY_EXECUTE,
    }
    setRequestToQueue(id, resolve as ReturnType<T>)
    process.send?.(msg)
  })
}

/*
 * Execute on child request by parent
 */
const executeOnChild = async (domain: Types.Domain, services: Types.LocalServices, message: Message.Execute): Promise<any> => {
  if (message.domain === domain) {
    if (services[message.command] != null) {
      return await promiseTry(() => {
        return services[message.command](...message.args)
      })
    }
  }
  return await Promise.reject(Error(`unknown execute domain: |${message.domain}| command: |${message.command}|`))
}

/*
 * Set Child to storage
 */
export const setChild = (child: Types.ChildProcess): void => {
  const childId = child.pid

  if (childId != null) {
    childrens[childId] = child
  }
}

/*
 * Return child by Id
 */
export const getChild = (childId: Types.ChildId): Types.ChildProcess => childrens[childId]

/*
 * For Diagnostic
 */
export const getChildrens = (): Types.Childrens => childrens
