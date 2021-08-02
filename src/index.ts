/*
 * Fork IPC - safe and easy fork IPC wrapper.
 */

import { child } from '@/child';
import { parent } from '@/parent';
import { system } from '@/system';

const { servicesAnnouncement } = child;
const { registerChild, execute } = parent;

export { execute, registerChild, servicesAnnouncement }
export { child, parent, system }

/** @deprecated */
export default { child, parent, system }
