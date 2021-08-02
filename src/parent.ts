import { onceFromChild, onFromChild, removeChildListener } from '@Lib/emitter';
import { registerLocal } from '@Lib/localProcessor';
import { allowToChild, registerChild } from '@Lib/parent';
import { doRequest } from '@Lib/requests';

export const parent = {
  allowToChild: allowToChild,
  execute: doRequest,
  on: onFromChild,
  once: onceFromChild,
  registerChild: registerChild,
  registerLocal: registerLocal,
  removeListener: removeChildListener
}
