import { CHANNEL } from '@Lib/constants'

export declare type ChildProcess = import('child_process').ChildProcess
export declare type ChildId = number
export declare type Childrens = Record<ChildId, ChildProcess>

export declare type Domain = string
export declare type Command = string
export declare type Channel = typeof CHANNEL

export declare type Args = any[]

export declare type LocalService = (...args: Args) => any
export declare type LocalServices = Record<Command, LocalService>
export declare type LocalProcessors = Record<Domain, LocalServices>

export declare type Services = Record<Command, ChildId>
export declare type Processors = Record<Domain, Services>

export declare type Result = unknown
export declare type ErrorString = string

export declare type Resolve = (value: unknown) => void
export declare type Reject = (reason?: any) => void
export declare type RequestId = string
export declare type RequestQueue = Record<RequestId, Resolve>

export declare type EventName = string
export declare type Listener = (...args: Args) => void

export declare type GrantOptions = Record<Domain, Command[]>
export declare type CommandGrants = Record<Command, boolean>
export declare type DomainGrants = Record<Domain, CommandGrants>
export declare type ChildrensGrants = Record<ChildId, DomainGrants>
