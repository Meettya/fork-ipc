/*
 * Fork IPC - safe and easy fork IPC wrapper.
 */

import * as child from '@/child';
import * as parent from '@/parent';
import { diagnostic } from '@/system';

const { servicesAnnouncement } = child;
const { registerChild, execute } = parent;
const system = { diagnostic };

export { execute, registerChild, servicesAnnouncement }
export { child, parent, system }

/** @deprecated */
export default { child, parent, system }
