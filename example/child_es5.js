/*
 * This is child process example
 */

var forkIpc = require('..').default;

function add (a, b) {
  return a + b;
}

forkIpc.child.servicesAnnouncement('test', { add: add });
