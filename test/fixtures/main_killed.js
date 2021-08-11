/*
 * Main
 */

const { execute, registerChild } = require("../../dist")

const childProcess = require("child_process")

const child2 = childProcess.fork("./child2.js")

registerChild(child2)
  .then(function () {
    child2.kill()
    return execute("example", "add", 2, 3)
  })
  .then(function (result) {
    console.log("KILLED execute OK")
    console.log(result)
  })
  .catch(function (err) {
    console.log("KILLED execute FAIL")
    console.log(err)
  })
