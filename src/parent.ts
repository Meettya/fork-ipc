import { onceFromChild, onFromChild, removeChildListener } from '@Lib/emitter';
import { registerLocal } from '@Lib/localProcessor';
import { allowToChild, registerChild } from '@Lib/parent';
import { doRequest } from '@Lib/requests';

export const execute = doRequest;
export const on = onFromChild;
export const once = onceFromChild;
export const removeListener = removeChildListener;

export {
  allowToChild,
  registerChild,
  registerLocal
};
