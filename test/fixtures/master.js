/*
 * Master
 */

var forkIpc = require('../..').default;

var childProcess  = require('child_process');

var child1 = childProcess.fork('./child1.js');
var child2 = childProcess.fork('./child2.js');

forkIpc.parent.once('test_event', function(result){
  console.log('MASTER once event resived');
  console.log(result);
});

forkIpc.parent.on('test_event', function(){
  console.log('MASTER on event resived');
  var res;
  
  res = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
  console.log(res);
});

forkIpc.parent.registerChild(child1)
  .then(function(){
    return forkIpc.parent.registerChild(child2);
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

    forkIpc.parent.execute('test', 'addAsync', 10, 22)
      .then(function(result){
        console.log('MASTER addAsync execute OK');
        console.log(result);
      })
      .catch(function(err){
        console.log('MASTER addAsync execute FAIL');
        console.log(err);
      });


    forkIpc.parent.execute('test', 'errorSync', 10, 22)
      .then(function(result){
        console.log('MASTER errorSync execute OK');
        console.log(result);
      })
      .catch(function(err){
        console.log('MASTER errorSync execute FAIL');
        console.log(err);
      });

    forkIpc.parent.execute('test', 'errorAsync', 10, 22)
      .then(function(result){
        console.log('MASTER errorAsync execute OK');
        console.log(result);
      })
      .catch(function(err){
        console.log('MASTER errorAsync execute FAIL');
        console.log(err);
      });

    forkIpc.parent.execute('example', 'add', 10, 20)
      .then(function(result){
        console.log('MASTER2 execute OK');
        console.log(result);
      })
      .catch(function(err){
        console.log('MASTER2 execute FAIL');
        console.log(err);
      });

    forkIpc.parent.execute('example', 'multiplyAsync', 5, 8)
      .then(function(result){
        console.log('MASTER2 execute OK');
        console.log(result);
      })
      .catch(function(err){
        console.log('MASTER2 execute FAIL');
        console.log(err);
      });

    forkIpc.parent.execute('example', 'foo', 5, 8)
      .then(function(result){
        console.log('foo execute OK');
        console.log(result);
      })
      .catch(function(err){
        console.log('foo execute FAIL');
        console.log(err);
      });

  })
  .catch(function(err){
    console.log('MASTER FAIL');
    console.log(err);
  });

