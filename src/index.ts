/*
 * Fork IPC - safe and easy fork IPC wrapper.
 */

import * as child from '@/child'
import * as parent from '@/parent'
import { diagnostic } from '@/system'

const { execute, registerChild } = parent
const { servicesAnnouncement } = child
const system = { diagnostic }

/** @deprecated */
export { execute, registerChild, servicesAnnouncement }
/** @deprecated */
export { child, parent, system }
/** @deprecated */
export default { child, parent, system }
