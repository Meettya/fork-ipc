# Fork IPC

## Overview:

fork-ipc designed to simplify the task of transfering functionality to child processes. Separation takes place in a secure environment, is used as the basic data transmission using a message from the parent to the child process and vice versa. Compared to the use of the network or pipe it provides more assurance of safety and less overhead to transmit requests and data.

Furthermore fork-ipc provides the ability to send messages from the child process to the parent, which may be useful in the processing of external signals, streaming, and so.

## What it is:

fork-ipc is an add-on ontop `child.send()`/`process.send()` functionality, provided by `child_process.fork()`. Messages are wrapped in a protocol(sort of), return promise for remote procedure calls, and has control for registered services.

## What it is NOT:

fork-ipc does not provide functionality for the creation of child processes, does not track their life cycle and are not restart of the unworked process.
All this should be implemented independently.

## Description:

Minimal example contains 2 files:

    // main.js 
    /*
     * This is parent process example
     */
    import forkIpc from 'fork-ipc'
    import { fork } from 'child_process'

    const child1 = fork('./child.js')

    forkIpc.parent.registerChild(child1)
      .then(() => {
        return forkIpc.parent.execute('test', 'add', 2, 3)
      })
      .then((result) => {
        console.log('MASTER execute OK');
        console.log(result);
      })
      .catch((err) => {
        console.log('MASTER execute FAIL');
        console.log(err);
      })
      .finally(function(){
        process.exit();
      });


    // child.js 
    /*
     * This is child process example
     */
    import forkIpc from 'fork-ipc'

    function add (a, b) {
      return a + b;
    }

    forkIpc.child.servicesAnnouncement('test', { add: add })


## Install:

    npm install fork-ipc

## Usage:

fork-ipc provides 2 types of interface - for parent and for child process

### Parent process API

#### Register child

    forkIpc.parent.registerChild(forkedProcess) -> Promise

Register child process, maked by `child_process.fork()` and return promise.
Re-registration are awailable in case of shoutdown old process only.
IMPORTANT: An attempt registration processes, providing the same services in the same domain will cause throw exception.

#### Execute remoute function

    forkIpc.parent.execute(domain, seviceName, ...arg) -> Promise

Make request to call remote service(function), at chosen domain, with any arguments in child process and return promise.
Promise will be rejected in case of requested process absence or child process unrichible.

#### Subscribe on messages

    forkIpc.parent.on(channel, cb)

Subscribe on messages from child process, via EventEmitter.

#### Subscribe on one message

    forkIpc.parent.once(channel, cb)

Subscribe once on message from child process, via EventEmitter.

#### Unsubscribe from masseges

    forkIpc.parent.removeListener(channel, cb)

Unsubscribe from messages from child process, via EventEmitter.

### Child process API

#### Annonce services

    forkIpc.child.servicesAnnouncement(domain, { seviceName: seviceFn, ... })

Annonce services (functions) at selected domain to parent process. Announced services only may be called by parent. Child process may announce some services at different domain.

#### Emit message

    forkIpc.child.emit(channel, ...args)

Emit message to parent process, via EventEmitter on parent side. May be used for notify parent on some events in child process.


