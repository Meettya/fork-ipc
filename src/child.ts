import { executeViaParent, servicesAnnouncement } from '@Lib/child'
import { emitToParent } from '@Lib/emitter'

export const emit = emitToParent
export const execute = executeViaParent
export { servicesAnnouncement }
