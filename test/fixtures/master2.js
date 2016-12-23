/*
 * Master
 */

var forkIpc = require('../..').default;

var childProcess  = require('child_process');

var child1 = childProcess.fork('./child1.js');
var child2 = childProcess.fork('./child2.js');

forkIpc.parent.registerChild(child1)
  .then(function(){
    console.log('registerChild(child2)');
    var res = forkIpc.parent.registerChild(child2);
    console.log(res);
    return res;
  })
  .then(function(){
    console.log('re-registerChild(child1)');
    var res = forkIpc.parent.registerChild(child1);
    console.log(res);
    return res;
  })
  .then(function(result){
    console.log('after re-registerChild')
    console.log(result);
  })
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