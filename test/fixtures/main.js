/*
 * Main
 */

const { registerChild, execute, parent } = require("../../dist");

var childProcess = require("child_process");

var child1 = childProcess.fork("./child1.js");
var child2 = childProcess.fork("./child2.js");

parent.once("test_event", function (result) {
  console.log("MAIN once event resived");
  console.log(result);
});

parent.on("test_event", function () {
  console.log("MAIN on event resived");
  var res;

  res = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
  console.log(res);
});

registerChild(child1)
  .then(function () {
    return registerChild(child2);
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

    execute("test", "addAsync", 10, 22)
      .then(function (result) {
        console.log("MAIN addAsync execute OK");
        console.log(result);
      })
      .catch(function (err) {
        console.log("MAIN addAsync execute FAIL");
        console.log(err);
      });

    execute("test", "errorSync", 10, 22)
      .then(function (result) {
        console.log("MAIN errorSync execute OK");
        console.log(result);
      })
      .catch(function (err) {
        console.log("MAIN errorSync execute FAIL");
        console.log(err);
      });

    execute("test", "errorAsync", 10, 22)
      .then(function (result) {
        console.log("MAIN errorAsync execute OK");
        console.log(result);
      })
      .catch(function (err) {
        console.log("MAIN errorAsync execute FAIL");
        console.log(err);
      });

    execute("example", "add", 10, 20)
      .then(function (result) {
        console.log("MAIN2 execute OK");
        console.log(result);
      })
      .catch(function (err) {
        console.log("MAIN2 execute FAIL");
        console.log(err);
      });

    execute("example", "multiplyAsync", 5, 8)
      .then(function (result) {
        console.log("MAIN2 execute OK");
        console.log(result);
      })
      .catch(function (err) {
        console.log("MAIN2 execute FAIL");
        console.log(err);
      });

    execute("example", "foo", 5, 8)
      .then(function (result) {
        console.log("foo execute OK");
        console.log(result);
      })
      .catch(function (err) {
        console.log("foo execute FAIL");
        console.log(err);
      });
  })
  .catch(function (err) {
    console.log("MAIN FAIL");
    console.log(err);
  });
