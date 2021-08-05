![Test status](https://github.com/Meettya/fork-ipc/actions/workflows/tests.yml/badge.svg?branch=master)

# Fork IPC

## Overview:

fork-ipc designed to simplify the task of transferring functionality to child processes. Separation takes place in a secure environment, is used as the basic data transmission using a message from the parent to the child process and vice versa. Compared to the use of the network or pipe it provides more assurance of safety and less overhead to transmit requests and data.

Furthermore fork-ipc provides the ability to send messages from the child process to the parent, which may be useful in the processing of external signals, streaming, and so.

Also child process may ask parent to execute(proxy) request and parent process has ACL-like rules for children upward request to prevent "all-may-all" case.

## What it is:

fork-ipc is an add-on ontop `child.send()`/`process.send()` functionality, provided by `child_process.fork()`. Messages are wrapped in a protocol(sort of), return promise for remote procedure calls, and has control for registered services.

## What it is NOT:

fork-ipc does not provide functionality for the creation of child processes, does not track their life cycle and are not restart of the unworked process.
All this should be implemented independently.

## Description:

Minimal example contains 2 files:

    // main.ts
    /*
     * This is parent process example
     */
    import { fork } from 'child_process';
    import { join } from 'path';

    import { execute, registerChild } from 'fork-ipc/parent';

    const child = fork(join(__dirname, 'child.js'))

    import type { Add } from './child';

    const main = async () => {
      await registerChild(child);
      const result = await execute<Add>('test', 'add', 2, 3);
      console.log(`Result is ${result}`);
    }

    main()
      .then(() => {
        console.log('MASTER execute OK');
      })
      .catch((err) => {
        console.log('MASTER execute FAIL');
        console.log(err);
      })
      .finally(function () {
        process.exit();
      });


    // child.ts
    /*
     * This is child process example
     */
    import { servicesAnnouncement } from 'fork-ipc/child';

    export type Add = (a: number, b: number) => number

    const add: Add = (a, b) => {
      return a + b
    }

    servicesAnnouncement('test', { add });

## Install:

    // using yarn
    yarn add fork-ipc

    // using npm
    npm install fork-ipc

## Usage:

fork-ipc provides 2 main types of interfaces - for parent and for child process

### Parent process API

#### Register child

    import { registerChild } from 'fork-ipc/parent'

    registerChild(ChildProcess) -> Promise

Register child process, make by `child_process.fork()` and return promise.

Re-registration are available in case of shutdown old process only.

IMPORTANT: An attempt registration processes, providing the same services in the same domain will cause throw exception.

#### Register local

    import { registerLocal } from 'fork-ipc/parent'

    registerLocal(domain, { seviceName: seviceFn, ... }) -> Promise

Register local service(function), defined here, at parent. Its executed prior, instead of registered service previously by child, for example for test.

#### Allow to call from Child

    import { allowToChild } from 'fork-ipc/parent'

    allowToChild(ChildProcess, { domain : [seviceName, ...], ...}) -> Promise

Grant to child process call(execute) listed service(function) at selected domain(s) and return promise.

Child can use listed service only, to prevent "all may all" arch.

IMPORTANT: there is no service reachable test in case of ability separate child registration. All checks will be doing in child call.

#### Execute remote function

    import { execute } from 'fork-ipc/parent'

    execute(domain, seviceName, ...arg) -> Promise

Make request to call remote service(function), at chosen domain, with any arguments in child process and return promise.

Promise will be rejected in case of requested process absence or child process unreachable.

#### Subscribe on messages

    import * as parent from 'fork-ipc/parent'

    parent.on(channel, cb)

Subscribe on messages from child process, via EventEmitter.

#### Subscribe on one message

    import * as parent from 'fork-ipc/parent'

    parent.once(channel, cb)

Subscribe once on message from child process, via EventEmitter.

#### Unsubscribe from messages

    import * as parent from 'fork-ipc/parent'

    parent.removeListener(channel, cb)

Unsubscribe from messages from child process, via EventEmitter.

### Child process API

#### Announce services

    import { servicesAnnouncement } from 'fork-ipc/child'

    servicesAnnouncement(domain, { seviceName: seviceFn, ... })

Announce services (functions) at selected domain to parent process. Announced services only may be called by parent. Child process may announce some services at different domain.

#### Execute remote function

    import { execute } from 'fork-ipc/child'

    execute(domain, seviceName, ...arg) -> Promise

Make request to call remote service(function), at chosen domain, with any arguments from child process to parent process and return promise.

Promise will be rejected in case of requested process absence or endpoint unreachable.

#### Emit message

    import * as child from 'fork-ipc/child'

    child.emit(channel, ...args)

Emit message to parent process, via EventEmitter on parent side. May be used for notify parent on some events in child process.
