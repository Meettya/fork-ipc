/*
 * Fork IPC - safe and easy fork IPC wrapper.
 */

import EventEmitter from 'events'

import { promiseTry,
  isPlainObject,
  getID,
  getIdConter,
} from './utils'

import { CHANNEL, ACTIONS, STATUS } from './constants'

import * as Types from './types';

const localEmitter = new EventEmitter()

// local variables
const childrens: Types.Childrens = {}
const childrensGrants: Types.ChildrensGrants = {}
const processors: Types.Processors = {}
const localProcessors: Types.LocalProcessors = {}
const requestQueue: Types.RequestQueue = {}

/*
 * Make request to service, will return promise
 */
const doRequest = (domain: Types.Domain, command: Types.Command, ...args: any[]) => {
  let childId: Types.ChildId
  let child: Types.ChildProcess

  // if exist local processor - execute it
  if (localProcessors[domain] && localProcessors[domain][command]) {
    return promiseTry(() => {
      return localProcessors[domain][command](...args)
    })
  }

  if (isPlainObject(processors[domain])) {
    childId = processors[domain][command]
    child = childrens[childId]
  }

  return new Promise((resolve, reject) => {
    if (!child) {
      reject(Error(`Not supported - domain |${domain}|, command |${command}|, rejected!`))
    } else {
      if (child.killed || child.exitCode !== null) {
        reject(Error(`Child died, cant execute domain |${domain}|, command |${command}|, rejected!`))
      } else {
        const id = getID('parent')

        requestQueue[id] = resolve
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
 * Do emit message to parent from child.
 */
const emitToParent = (eventName: Types.EventName, ...data: any[]) => {
  process.send!({
    data,
    eventName,
    channel: CHANNEL,
    type: ACTIONS.EMIT
  })
}

/*
 * Subscribe on parent to child message.
 */
const onFromChild = (eventName: Types.EventName, listener: Types.Listener) => {
  localEmitter.on(eventName, listener)
}

/*
 * Subscribe on parent to child message for once maessage.
 */
const onceFromChild = (eventName: Types.EventName, listener: Types.Listener) => {
  localEmitter.once(eventName, listener)
}

/*
 * Unsubscribe on parent from child message.
 */
const removeChildListener = (eventName: Types.EventName, listener: Types.Listener) => {
  localEmitter.removeListener(eventName, listener)
}

/*
 * Register child in parent process
 * actualy subscribe to children messages
 */
const registerChild = (child: Types.ChildProcess) => {
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
 * Register services localy
 */
const registerLocal = (domain: Types.Domain, services: Types.LocalServices) => {
  return new Promise((resolve, reject) => {
    if (!isPlainObject(localProcessors[domain])) {
      localProcessors[domain] = {}
    }

    for (const service in services) {
      if (services.hasOwnProperty(service)) {
        const fn = services[service]
        if (typeof fn !== 'function') {
          return reject(Error(`Service ${service} not a function, reject!`))
        }
        localProcessors[domain][service] = fn
      }
    }
    resolve('local registered!')
  })
}

/*
 * Register all allowed to call at parent from child services
 * Save it as object, to speed up check phase
 */
const allowToChild = (child: Types.ChildProcess, options: Types.GrantOptions) => {
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
 * Announce supported services in domain into child proc
 * as is AND set listener to parent AND send message to parent
 */
const servicesAnnouncement = (domain: Types.Domain, services: Types.LocalServices) => {
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
 * Execute via parent request by child
 * service(function) may be routed by parent to another child or announced by parent inself
 */
const executeViaParent = (domain: Types.Domain, command: Types.Command, ...args: any[]) => {
  const id = getID('child')

  return new Promise((resolve) => {
    requestQueue[id] = resolve
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
 * Send request result to parent
 */
const doResponce = (message: Types.MessageAny) => {
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
 * Process emited event on parent
 */
const processEmited = (message: Types.MessageAny) => {
  localEmitter.emit(message.eventName, ...message.data)
}

/*
 * Process proxy execute on parent by child
 */
const proxyExecuteOnParent = (message: Types.MessageAny) => {
  let child = childrens[message.pid]

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
 * Register anounced services by child in master
 */
interface IRegisterProcessor {
  (child: Types.ChildProcess, message: Types.MessageAny, resolve: Types.Resolve, reject: Types.Reject): void;
}

const registerProcessor: IRegisterProcessor = (child, message, resolve, reject) => {
  let { services, domain } = message
  const childId = child.pid

  if (!(Array.isArray(services) && childId)) {
    return reject(Error('Cant register child, no services or childId'))
  }

  // save child to storage
  childrens[childId] = child

  if (!processors[domain]) {
    processors[domain] = {}
  }

  for (const command of services) {
    if (processors[domain][command]) {
      const oldChild = childrens[processors[domain][command]]
      // just do not re-register identical function
      if (oldChild.pid === child.pid) {
        continue
      }

      if (!(oldChild.killed || oldChild.exitCode !== null)) {
        // yes, if we are try to register another one command processor while current alive - stop with error
        return reject(Error(`Already registered - domain |${domain}|, command |${command}|, halt!`))
      }
    }
    processors[domain][command] = childId
  }

  return resolve('registered')
}

/*
 * For diagnostic
 */
const doDiagnostic = () => {
  return {
    idCounter: getIdConter(),
    childrens,
    childrensGrants,
    processors,
    requestQueue
  }
}

export default {
  child: {
    emit: emitToParent,
    execute: executeViaParent,
    servicesAnnouncement: servicesAnnouncement
  },
  parent: {
    allowToChild: allowToChild,
    execute: doRequest,
    on: onFromChild,
    once: onceFromChild,
    registerChild: registerChild,
    registerLocal: registerLocal,
    removeListener: removeChildListener
  },
  system: {
    diagnostic: doDiagnostic
  }
}
