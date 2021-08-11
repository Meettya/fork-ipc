/*
 * child2
 */

const { child, servicesAnnouncement } = require("../..")

function add(a, b) {
  return a + b
}

function multiplyAsync(a, b) {
  return new Promise(function (resolve, reject) {
    const resolver = function () {
      return resolve(a * b)
    }

    setTimeout(resolver, 1000)
  })
}

function makeEmit(a) {
  child.emit("emiterBus", a)
}

function doDie() {
  const delayed = function () {
    process.exit()
  }

  setTimeout(delayed, 100)
}

function askSibling(a, b) {
  return child.execute("test", "addAsync", a, b)
}

function askParent(a, b) {
  return child.execute("test", "localFn", a, b)
}

const services = {
  add,
  askParent,
  askSibling,
  doDie,
  makeEmit,
  multiplyAsync,
}

servicesAnnouncement("example", services)

child.emit("test_event", "bazzz")
child.emit("test_event2", "fooBar")
