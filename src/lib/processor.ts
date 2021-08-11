/*
 * Processor for Fork IPC
 */

import { getChild, setChild } from '@Lib/child'
import { isPlainObject } from '@Lib/utils'
import * as Types from '@Types/common'
import * as Message from '@Types/message'

const processors: Types.Processors = {}

/*
 * Register anounced services by child in main process
 */
export const registerProcessor = (child: Types.ChildProcess, message: Message.Register, resolve: Types.Resolve, reject: Types.Reject): void => {
  const { domain, services } = message
  const childId = child.pid

  if (!(Array.isArray(services) && childId != null)) {
    return reject(Error('Cant register child, no services or childId'))
  }

  // save child to storage
  setChild(child)

  if (processors[domain] == null) {
    processors[domain] = {}
  }

  for (const command of services) {
    const oldChildId = getChildId(domain, command)
    if (oldChildId != null) {
      const oldChild = getChild(oldChildId)
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
 * Return registered ChildId
 */
export const getChildId = (domain: Types.Domain, command: Types.Command): Types.ChildId | undefined => {
  if (isPlainObject(processors[domain])) {
    return processors[domain][command]
  }
}

/*
 * For diagnostics
 */
export const getProcessors = (): Types.Processors => processors
