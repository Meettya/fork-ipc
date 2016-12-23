import forkIpc from 'fork-ipc'

function add (a, b) {
  return a + b;
}

forkIpc.child.servicesAnnouncement('test', { add: add });
