import { executeViaParent, servicesAnnouncement } from '@Lib/child';
import { emitToParent } from '@Lib/emitter';

export const child = {
  emit: emitToParent,
  execute: executeViaParent,
  servicesAnnouncement: servicesAnnouncement
};
