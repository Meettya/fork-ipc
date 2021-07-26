/*
 * Processor for Fork IPC
 */

import { getChild, setChild } from '@Lib/child';
import { isPlainObject } from '@Lib/utils';
import * as Types from '@Types/common';
import * as Message from '@Types/message';

const processors: Types.Processors = {}

/*
 * Register anounced services by child in master
 */
export const registerProcessor = (child: Types.ChildProcess, message: Message.Register, resolve: Types.Resolve, reject: Types.Reject) => {
  let { services, domain } = message
  const childId = child.pid

  if (!(Array.isArray(services) && childId)) {
    return reject(Error('Cant register child, no services or childId'))
  }

  // save child to storage
  setChild(child)

  if (!processors[domain]) {
    processors[domain] = {}
  }

  for (const command of services) {
    const oldChildId = getChildId(domain, command)
    if (oldChildId) {
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
export const getChildId = (domain: Types.Domain, command: Types.Command): Types.ChildId | void => {
  if (isPlainObject(processors[domain])) {
    return processors[domain][command]
  }
}

/*
 * For diagnostics
 */
export const getProcessors = () => processors
