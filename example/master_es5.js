/*
 * This is parent process example
 */
var forkIpc = require('..').default;
var childProcess = require('child_process');

var child1 = childProcess.fork('./child_es5.js')

forkIpc.parent.registerChild(child1)
  .then(function(){
    return forkIpc.parent.execute('test', 'add', 2, 3)
  })
  .then(function(result){
    console.log('MASTER execute OK');
    console.log(result);
  })
  .catch(function(err){
    console.log('MASTER execute FAIL');
    console.log(err);
  })
  .finally(function(){
    process.exit();
  });
