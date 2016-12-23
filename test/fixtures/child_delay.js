/*
 * child1
 */

var Promise = require('bluebird');

var forkIpc = require('../..').default;

function add (a, b) {
  return a + b;
}

function addAsync (a,b) {
  return new Promise(function(resolve, reject){
    var resolver = function() {
      return resolve (a + b);
    };

    setTimeout(resolver, 1000);
  })
}

function errorSync () {
  throw Error('just sinc error');
}

function errorAsync () {
  return Promise.reject('just ASINC error');
}

var delayed = function () {
  //console.log('child delayed run');
  forkIpc.child.servicesAnnouncement('test', { add: add, addAsync : addAsync, errorSync: errorSync, errorAsync : errorAsync });
}

//console.log('child before delay');
setTimeout(delayed, 500);

