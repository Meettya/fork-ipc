/*
 * Master
 */

var forkIpc = require('../..').default;

var childProcess  = require('child_process');

var child2 = childProcess.fork('./child2.js');

forkIpc.parent.registerChild(child2)
  .then(function(){
    child2.kill()
    return forkIpc.parent.execute('example', 'add', 2, 3)
  })
  .then(function(result){
    console.log('KILLED execute OK');
    console.log(result);
  })
  .catch(function(err){
    console.log('KILLED execute FAIL');
    console.log(err);
  });