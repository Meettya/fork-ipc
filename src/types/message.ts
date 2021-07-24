import { ACTIONS, STATUS } from '@Lib/constants';
import * as Common from '@Types/common';

export declare interface Register {
  domain: Common.Domain,
  channel: Common.Channel,
  pid: Common.ChildId,
  services: Common.Command[],
  type: ACTIONS.REGISTER
}

declare interface Result {
  channel: Common.Channel,
  id: Common.RequestId,
  status: STATUS.OK | STATUS.FAIL,
  type: ACTIONS.RESULT
}

export declare interface ResultOk extends Result {
  result: Common.Result,
  status: STATUS.OK
}

export declare interface ResultFail extends Result {
  error: Common.ErrorString,
  status: STATUS.FAIL
}

export declare interface ProxyExecute {
  args: Common.Args,
  command: Common.Command,
  domain: Common.Domain,
  id: Common.RequestId,
  channel: Common.Channel,
  pid: Common.ChildId,
  type: ACTIONS.PROXY_EXECUTE
}

export declare interface Emit {
  data: Common.Args,
  eventName: Common.EventName,
  channel: Common.Channel,
  type: ACTIONS.EMIT
}
