/*
 * Fork IPC - safe and easy fork IPC wrapper.
 */

import Promise from 'bluebird'
import EventEmitter from 'events'
import isPlainObject from 'lodash.isplainobject'
import isFunction from 'lodash.isfunction'

const CHANNEL = 'FORK_IPC_CHANNEL'

const ACTION = {
  ASK_REGISTER: 'ASK_REGISTER',
  EMIT: 'EMIT',
  EXECUTE: 'EXECUTE',
  PROXY_EXECUTE: 'PROXY_EXECUTE',
  REGISTER: 'REGISTER',
  RESULT: 'RESULT'
}

const STATUS = {
  FAIL: 'FAIL',
  OK: 'OK',
  PENDING: 'PENDING'
}

const localEmitter = new EventEmitter()

// local variables
let idCounter = 0
let childrens = {}
let childrensGrants = {}
let processors = {}
let localProcessors = {}
let requestQueue = {}

/*
 * Make request to service, will return promise
 */
function doRequest (domain, command, ...args) {
  let childId, child

  // if exist local processor - execute it
  if (localProcessors[domain] && localProcessors[domain][command]) {
    return Promise.try(() => {
      return localProcessors[domain][command](...args)
    })
  }

  if (isPlainObject(processors[domain])) {
    childId = processors[domain][command]
    child = childrens[childId]
  }

  return new Promise((resolve, reject) => {
    if (!child) {
      reject(`Not supported - domain |${domain}|, command |${command}|, rejected!`)
    } else {
      if (child.killed || child.exitCode !== null) {
        reject(`Child died, cant execute domain |${domain}|, command |${command}|, rejected!`)
      } else {
        const id = getID('parent')

        requestQueue[id] = resolve
        child.send({
          args,
          command,
          domain,
          id,
          channel: CHANNEL,
          type: ACTION.EXECUTE
        })
      }
    }
  })
}

/*
 * Do emit message to parent from child.
 */
function emitToParent (eventName, ...data) {
  process.send({
    data,
    eventName,
    channel: CHANNEL,
    type: ACTION.EMIT
  })
}

/*
 * Subscribe on parent to child message.
 */
function onFromChild (eventName, listener) {
  localEmitter.on(eventName, listener)
}

/*
 * Subscribe on parent to child message for once maessage.
 */
function onceFromChild (eventName, listener) {
  localEmitter.once(eventName, listener)
}

/*
 * Unsubscribe on parent from child message.
 */
function removeChildListener (eventName, listener) {
  localEmitter.removeListener(eventName, listener)
}

/*
 * Register child in parent process
 * actualy subscribe to children messages
 */
function registerChild (child) {
  return new Promise((resolve, reject) => {
    child.on('message', (message) => {
      if (isPlainObject(message) && message.channel === CHANNEL) {
        switch (message.type) {
          case ACTION.REGISTER:
            registerProcessor(child, message)
            resolve('registered')
            break
          case ACTION.RESULT:
            doResponce(message)
            break
          case ACTION.EMIT:
            processEmited(message)
            break
          case ACTION.PROXY_EXECUTE:
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
      type: ACTION.ASK_REGISTER
    })
  })
}

/*
 * Register services localy
 */
function registerLocal (domain, services) {
  return new Promise((resolve, reject) => {
    if (!isPlainObject(localProcessors[domain])){
      localProcessors[domain] = {}
    }

    for (const service in services) {
      if (services.hasOwnProperty(service)) {
        const fn = services[service]
        if (!isFunction(fn)){
          return reject(`Service ${service} not a function, reject!`)
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
function allowToChild (child, options) {
  const childId = child.pid

  return new Promise((resolve, reject) => {
    if (!isPlainObject(options)){
      return reject('Grant options are misstyped, MUST be an object!')
    }

    if (!isPlainObject(childrensGrants[childId])) {
      childrensGrants[childId] = {}
      for (const domain in options) {
        if (options.hasOwnProperty(domain)) {
          const services = options[domain]

          if (!isPlainObject(childrensGrants[childId][domain])){
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
function servicesAnnouncement (domain, services) {
  const childRegister = () => {
    process.send({
      domain,
      channel: CHANNEL,
      pid: process.pid,
      services: Object.keys(services),
      type: ACTION.REGISTER
    })
  }

  process.on('message', (message) => {
    if (isPlainObject(message) && message.channel === CHANNEL) {
      switch (message.type) {
        case ACTION.ASK_REGISTER:
          childRegister()
          break
        case ACTION.EXECUTE:
          executeOnChild(domain, services, message)
            .then((result) => {
              process.send({
                result,
                channel: CHANNEL,
                id: message.id,
                status: STATUS.OK,
                type: ACTION.RESULT
              })
            })
            .catch((error) => {
              // transform error from object to text
              if (error instanceof Error) {
                error = error.message
              }
              process.send({
                error,
                channel: CHANNEL,
                id: message.id,
                status: STATUS.FAIL,
                type: ACTION.RESULT
              })
            })
          break
        case ACTION.PROXY_RESULT:
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
function executeOnChild (domain, services, message) {
  if (message.domain === domain) {
    if (services[message.command]) {
      return Promise.try(() => {
        return services[message.command](...message.args)
      })
    }
  }
  return Promise.reject(`unknown execute domain: |${message.domain}| command: |${message.command}|`)
}

/*
 * Execute via parent request by child
 * service(function) may be routed by parent to another child or announced by parent inself
 */
function executeViaParent (domain, command, ...args) {
  const id = getID('child')

  return new Promise((resolve, reject) => {
    requestQueue[id] = resolve
    process.send({
      args,
      command,
      domain,
      id,
      channel: CHANNEL,
      pid: process.pid,
      type: ACTION.PROXY_EXECUTE
    })
  })
}

/*
 * Send request result to parent
 */
function doResponce (message) {
  if (requestQueue[message.id]) {
    if (message.status === STATUS.OK) {
      requestQueue[message.id](message.result)
    } else if (message.status === STATUS.FAIL) {
      requestQueue[message.id](Promise.reject(message.error))
    } else {
      requestQueue[message.id](Promise.reject(`unknown status |${message.status}|`))
    }
  }
}

/*
 * Process emited event on parent
 */
function processEmited (message) {
  localEmitter.emit(message.eventName, ...message.data)
}

/*
 * Process proxy execute on parent by child
 */
function proxyExecuteOnParent (message) {
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
          type: ACTION.PROXY_RESULT
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
          type: ACTION.PROXY_RESULT
        })
      })
  } else {
    child.send({
      channel: CHANNEL,
      error: 'Cant execute or not granted, reject!',
      id: message.id,
      status: STATUS.FAIL,
      type: ACTION.PROXY_RESULT
    })
  }
}

/*
 * Register anounced services by child in master
 */
function registerProcessor (child, message) {
  let {services, domain} = message
  const childId = child.pid

  if (!Array.isArray(services)) {
    return
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
        throw Error(`Already registered - domain |${domain}|, command |${command}|, halt!`)
      }
    }
    processors[domain][command] = childId
  }
}

/*
 * Return new request ID.
 * Its seems simply increment ok
 */
function getID (prefix) {
  idCounter += 1
  return `${prefix}${idCounter}`
}

/*
 * For diagnostic
 */
function doDiagnostic () {
  return {
    idCounter,
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
