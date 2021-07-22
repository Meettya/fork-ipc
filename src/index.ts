/*
 * Fork IPC - safe and easy fork IPC wrapper.
 */

import { executeViaParent, getChildrens, servicesAnnouncement } from './child';
import { emitToParent, onceFromChild, onFromChild, removeChildListener } from './emitter';
import { registerLocal } from './localProcessor';
import { allowToChild, getChildrensGrants, registerChild } from './parent';
import { getProcessors } from './processor';
import { doRequest, getRequestQueue } from './requests';
import { getIdConter } from './utils';

const child = {
  emit: emitToParent,
  execute: executeViaParent,
  servicesAnnouncement: servicesAnnouncement
};

const parent = {
  allowToChild: allowToChild,
  execute: doRequest,
  on: onFromChild,
  once: onceFromChild,
  registerChild: registerChild,
  registerLocal: registerLocal,
  removeListener: removeChildListener
}

/*
 * For diagnostic
 */
const system = {
  diagnostic: () => (
    {
      idCounter: getIdConter(),
      childrens: getChildrens(),
      childrensGrants: getChildrensGrants(),
      processors: getProcessors(),
      requestQueue: getRequestQueue()
    }
  )
}

export { doRequest as execute }
export { registerChild }
export { servicesAnnouncement }
export { child }
export { parent }
export { system }

export default { child, parent, system }
