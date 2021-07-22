/*
 * child2
 */

var forkIpc = require('../..').default;

function add (a, b) {
  return a + b;
}

function multiplyAsync (a,b) {
  return new Promise(function(resolve, reject){
    var resolver = function() {
      return resolve (a * b);
    };

    setTimeout(resolver, 1000);
  })
}

function makeEmit (a) {
  forkIpc.child.emit('emiterBus', a);
}

function doDie () {
  var delayed = function() {
    process.exit()
  }
  
  setTimeout(delayed, 100);
}

function askSibling (a, b) {
  return forkIpc.child.execute('test', 'addAsync', a, b)
}

function askParent (a, b) {
  return forkIpc.child.execute('test', 'localFn', a, b)
}

const services = {
  add: add,
  askParent: askParent,
  askSibling: askSibling,
  doDie: doDie,
  makeEmit: makeEmit,
  multiplyAsync: multiplyAsync
}

forkIpc.child.servicesAnnouncement('example', services);

forkIpc.child.emit('test_event', 'bazzz');
forkIpc.child.emit('test_event2', 'fooBar');
