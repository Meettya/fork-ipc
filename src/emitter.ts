import EventEmitter from 'events';

import { ACTIONS, CHANNEL } from './constants';
import * as Types from './types';

const localEmitter = new EventEmitter()

/*
 * Do emit message to parent from child.
 */
export const emitToParent = (eventName: Types.EventName, ...data: any[]) => {
    process.send!({
        data,
        eventName,
        channel: CHANNEL,
        type: ACTIONS.EMIT
    })
}

/*
 * Subscribe on parent to child message.
 */
export const onFromChild = (eventName: Types.EventName, listener: Types.Listener) => {
    localEmitter.on(eventName, listener)
}

/*
 * Subscribe on parent to child message for once maessage.
 */
export const onceFromChild = (eventName: Types.EventName, listener: Types.Listener) => {
    localEmitter.once(eventName, listener)
}

/*
 * Unsubscribe on parent from child message.
 */
export const removeChildListener = (eventName: Types.EventName, listener: Types.Listener) => {
    localEmitter.removeListener(eventName, listener)
}

/*
 * Process emited event on parent
 */
export const processEmited = (message: Types.MessageAny) => {
    localEmitter.emit(message.eventName, ...message.data)
}
