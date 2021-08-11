/*
 * child1
 */

const { servicesAnnouncement } = require("../..")

function add(a, b) {
  return a + b
}

function addAsync(a, b) {
  return new Promise(function (resolve, reject) {
    const resolver = function () {
      return resolve(a + b)
    }

    setTimeout(resolver, 500)
  })
}

function errorSync() {
  throw Error("just sinc error")
}

function errorAsync() {
  return Promise.reject(Error("just ASINC error"))
}

servicesAnnouncement("test", {
  add: add,
  addAsync: addAsync,
  errorAsync: errorAsync,
  errorSync: errorSync,
})
