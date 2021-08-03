/*
 * Local Processor for Fork IPC
 */

import { isPlainObject } from '@Lib/utils';
import * as Types from '@Types/common';

const localProcessors: Types.LocalProcessors = {}

/*
 * Register services localy
 */
export const registerLocal = (domain: Types.Domain, services: Types.LocalServices) => {
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

export const tryGetLocalProcessor = (domain: Types.Domain, command: Types.Command) => (
  localProcessors[domain] && localProcessors[domain][command]
)
