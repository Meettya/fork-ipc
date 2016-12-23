/*
 * This is parent process example
 */
import forkIpc from 'fork-ipc'
import { fork } from 'child_process'

const child1 = fork('./child.js')

forkIpc.parent.registerChild(child1)
  .then(() => {
    return forkIpc.parent.execute('test', 'add', 2, 3)
  })
  .then((result) => {
    console.log('MASTER execute OK');
    console.log(result);
  })
  .catch((err) => {
    console.log('MASTER execute FAIL');
    console.log(err);
  })
  .finally(() => {
    process.exit();
  });
