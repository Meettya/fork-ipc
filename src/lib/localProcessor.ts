/*
 * Local Processor for Fork IPC
 */

import { isPlainObject } from '@Lib/utils'
import * as Types from '@Types/common'

const localProcessors: Types.LocalProcessors = {}

/*
 * Register services localy
 */
export const registerLocal = async (domain: Types.Domain, services: Types.LocalServices): Promise<any> => {
  return await new Promise((resolve, reject) => {
    if (domain === '__proto__') {
      return reject(Error(`Domain name ${domain} not allowed, reject!`))
    }

    if (!isPlainObject(localProcessors[domain])) {
      localProcessors[domain] = {}
    }

    for (const service in services) {
      if (Object.prototype.hasOwnProperty.call(services, service)) {
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

export const tryGetLocalProcessor = (domain: Types.Domain, command: Types.Command): Types.LocalService => (
  localProcessors[domain]?.[command]
)
