/*
 * Child functional for Fork IPC
 */

import { ACTIONS, CHANNEL, STATUS } from './constants';
import { doResponce, setRequestToQueue } from './requests';
import * as Types from './types';
import { getID, isPlainObject, promiseTry } from './utils';

const childrens: Types.Childrens = {}

/*
 * Announce supported services in domain into child proc
 * as is AND set listener to parent AND send message to parent
 */
export const servicesAnnouncement = (domain: Types.Domain, services: Types.LocalServices) => {
    const childRegister = () => {
        process.send!({
            domain,
            channel: CHANNEL,
            pid: process.pid,
            services: Object.keys(services),
            type: ACTIONS.REGISTER
        })
    }

    process.on('message', (message: Types.MessageAny) => {
        if (isPlainObject(message) && message.channel === CHANNEL) {
            switch (message.type) {
                case ACTIONS.ASK_REGISTER:
                    childRegister()
                    break
                case ACTIONS.EXECUTE:
                    executeOnChild(domain, services, message)
                        .then((result) => {
                            process.send!({
                                result,
                                channel: CHANNEL,
                                id: message.id,
                                status: STATUS.OK,
                                type: ACTIONS.RESULT
                            })
                        })
                        .catch((error) => {
                            // transform error from object to text
                            if (error instanceof Error) {
                                error = error.message
                            }
                            process.send!({
                                error,
                                channel: CHANNEL,
                                id: message.id,
                                status: STATUS.FAIL,
                                type: ACTIONS.RESULT
                            })
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
export const executeViaParent = (domain: Types.Domain, command: Types.Command, ...args: any[]) => {
    const id = getID('child')

    return new Promise((resolve) => {
        setRequestToQueue(id, resolve)
        process.send!({
            args,
            command,
            domain,
            id,
            channel: CHANNEL,
            pid: process.pid,
            type: ACTIONS.PROXY_EXECUTE
        })
    })
}

/*
 * Execute on child request by parent
 */
const executeOnChild = (domain: Types.Domain, services: Types.LocalServices, message: Types.MessageAny) => {
    if (message.domain === domain) {
        if (services[message.command]) {
            return promiseTry(() => {
                return services[message.command](...message.args)
            })
        }
    }
    return Promise.reject(Error(`unknown execute domain: |${message.domain}| command: |${message.command}|`))
}

/*
 * Set Child to storage
 */
export const setChild = (child: Types.ChildProcess) => {
    const childId = child.pid

    if (childId) {
        childrens[childId] = child
    }
}

/*
 * Return child by Id
 */
export const getChild = (childId: Types.ChildId) => childrens[childId]

/*
 * For Diagnostic
 */
export const getChildrens = () => childrens
