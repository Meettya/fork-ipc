/*
 * Main
 */

const { registerChild, execute } = require("../../dist");

var childProcess = require("child_process");

var child1 = childProcess.fork("./child1.js");
var child2 = childProcess.fork("./child2.js");

registerChild(child1)
  .then(function () {
    console.log("registerChild(child2)");
    var res = registerChild(child2);
    console.log(res);
    return res;
  })
  .then(function () {
    console.log("re-registerChild(child1)");
    var res = registerChild(child1);
    console.log(res);
    return res;
  })
  .then(function (result) {
    console.log("after re-registerChild");
    console.log(result);
  })
  .then(function (result) {
    execute("test", "add", 2, 3)
      .then(function (result) {
        console.log("MAIN execute OK");
        console.log(result);
      })
      .catch(function (err) {
        console.log("MAIN execute FAIL");
        console.log(err);
      });
  })
  .catch(function (err) {
    console.log("MAIN FAIL");
    console.log(err);
  });
