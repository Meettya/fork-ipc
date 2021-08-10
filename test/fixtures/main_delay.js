/*
 * Main
 */

const { registerChild, execute } = require("../../dist");

var childProcess = require("child_process");

var child1 = childProcess.fork("./child1.js");

var delayed = function () {
  console.log("start delayed");

  registerChild(child1)
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
};

console.log("before timeout");
setTimeout(delayed, 1500);
