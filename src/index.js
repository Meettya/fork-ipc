/*
 * Fork IPC - safe and easy fork IPC wrapper.
 */

import Promise from 'bluebird'
import EventEmitter from 'events'
import isPlainObject from 'lodash.isplainobject'

const CHANNEL = 'FORK_IPC_CHANNEL'

const ACTION = {
  ASK_REGISTER: 'ASK_REGISTER',
  EMIT: 'EMIT',
  EXECUTE: 'EXECUTE',
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
let processors = {}
let requestQueue = {}

/*
 * Make request to service, will return promise
 */
function doRequest (domain, command, ...args) {
  let childId, child

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
        const id = getID()

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
                domain,
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
                domain,
                error,
                channel: CHANNEL,
                id: message.id,
                status: STATUS.FAIL,
                type: ACTION.RESULT
              })
            })
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
 * Register anounced services by child in master
 */
function registerProcessor (child, message) {
  let {services, domain} = message
  const childId = getID()

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
function getID () {
  idCounter += 1
  return idCounter
}

export default {
  child: {
    emit: emitToParent,
    servicesAnnouncement: servicesAnnouncement
  },
  parent: {
    execute: doRequest,
    on: onFromChild,
    once: onceFromChild,
    registerChild: registerChild,
    removeListener: removeChildListener
  }
}
