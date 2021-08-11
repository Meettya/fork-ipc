/*
 * Emitter functional for Fork IPC
 */

import { EventEmitter } from 'events'

import { ACTIONS, CHANNEL } from '@Lib/constants'
import * as Types from '@Types/common'
import * as Message from '@Types/message'

const localEmitter = new EventEmitter()

/*
 * Do emit message to parent from child.
 */
export const emitToParent = (eventName: Types.EventName, ...data: Types.Args): void => {
  const msg: Message.Emit = {
    channel: CHANNEL,
    data,
    eventName,
    type: ACTIONS.EMIT,
  }

  process.send?.(msg)
}

/*
 * Subscribe on parent to child message.
 */
export const onFromChild = (eventName: Types.EventName, listener: Types.Listener): void => {
  localEmitter.on(eventName, listener)
}

/*
 * Subscribe on parent to child message for once maessage.
 */
export const onceFromChild = (eventName: Types.EventName, listener: Types.Listener): void => {
  localEmitter.once(eventName, listener)
}

/*
 * Unsubscribe on parent from child message.
 */
export const removeChildListener = (eventName: Types.EventName, listener: Types.Listener): void => {
  localEmitter.removeListener(eventName, listener)
}

/*
 * Process emited event on parent
 */
export const processEmited = (message: Message.Emit): void => {
  localEmitter.emit(message.eventName, ...message.data)
}
