/*
 * child2
 */

var Promise = require('bluebird');

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

forkIpc.child.servicesAnnouncement('example', { add: add, multiplyAsync : multiplyAsync, makeEmit : makeEmit, doDie : doDie });

forkIpc.child.emit('test_event', 'bazzz');
forkIpc.child.emit('test_event2', 'fooBar');