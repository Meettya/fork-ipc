import { ACTIONS, STATUS } from '@Lib/constants';
import * as Common from '@Types/common';

export declare interface AskRegister {
  channel: Common.Channel,
  type: ACTIONS.ASK_REGISTER
}

export declare interface Register {
  domain: Common.Domain,
  channel: Common.Channel,
  pid: Common.ChildId,
  services: Common.Command[],
  type: ACTIONS.REGISTER
}

export declare interface Emit {
  data: Common.Args,
  eventName: Common.EventName,
  channel: Common.Channel,
  type: ACTIONS.EMIT
}

declare interface GenericResult {
  channel: Common.Channel,
  id: Common.RequestId,
  status: STATUS.OK | STATUS.FAIL,
  type: ACTIONS.RESULT | ACTIONS.PROXY_RESULT
}

declare interface GenericResultOk {
  result: Common.Result,
  status: STATUS.OK
}

declare interface GenericResultFail {
  error: Common.ErrorString,
  status: STATUS.FAIL
}

declare interface ResultMessageType {
  type: ACTIONS.RESULT
}

declare interface ProxyResultMessageType {
  type: ACTIONS.PROXY_RESULT
}

export declare type ResultOk = GenericResult & ResultMessageType & GenericResultOk
export declare type ResultFail = GenericResult & ResultMessageType & GenericResultFail
export declare type ProxyResultOk = GenericResult & ProxyResultMessageType & GenericResultOk
export declare type ProxyResultFail = GenericResult & ProxyResultMessageType & GenericResultFail
export declare type ProxyResultKnown = ProxyResultOk | ProxyResultFail
export declare type ResultKnown = ResultOk | ResultFail

declare interface GenericExecute {
  args: Common.Args,
  command: Common.Command,
  domain: Common.Domain,
  id: Common.RequestId,
  channel: Common.Channel,
  type: ACTIONS.EXECUTE | ACTIONS.PROXY_EXECUTE
}

export declare interface Execute extends GenericExecute {
  type: ACTIONS.EXECUTE
}

export declare interface ProxyExecute extends GenericExecute {
  pid: Common.ChildId,
  type: ACTIONS.PROXY_EXECUTE
}
