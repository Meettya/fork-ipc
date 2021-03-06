/*
 * Master
 */

var forkIpc = require('../..').default;

var childProcess  = require('child_process');

var child1 = childProcess.fork('./child1.js');

var delayed = function () {
  console.log('start delayed');

  forkIpc.parent.registerChild(child1)
    .then(function(result){

      forkIpc.parent.execute('test', 'add', 2, 3)
        .then(function(result){
          console.log('MASTER execute OK');
          console.log(result);
        })
        .catch(function(err){
          console.log('MASTER execute FAIL');
          console.log(err);
        });

    })
    .catch(function(err){
      console.log('MASTER FAIL');
      console.log(err);
    });
};

console.log('before timeout');
setTimeout(delayed, 1500);
