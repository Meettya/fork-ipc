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

/*
 * For diagnostic
 */
const doDiagnostic = () => {
  return {
    idCounter: getIdConter(),
    childrens: getChildrens(),
    childrensGrants: getChildrensGrants(),
    processors: getProcessors(),
    requestQueue: getRequestQueue()
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
