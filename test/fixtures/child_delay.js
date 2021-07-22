/*
 * child1
 */

const { servicesAnnouncement } = require("../..");

function add(a, b) {
  return a + b;
}

function addAsync(a, b) {
  return new Promise(function (resolve, reject) {
    var resolver = function () {
      return resolve(a + b);
    };

    setTimeout(resolver, 1000);
  });
}

function errorSync() {
  throw Error("just sinc error");
}

function errorAsync() {
  return Promise.reject("just ASINC error");
}

var delayed = function () {
  //console.log('child delayed run');
  servicesAnnouncement("test", { add, addAsync, errorSync, errorAsync });
};

//console.log('child before delay');
setTimeout(delayed, 500);
