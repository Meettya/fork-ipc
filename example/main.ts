/*
 * This is parent process example
 */

import { fork } from 'child_process';
import { join } from 'path';

import { execute, registerChild } from '../dist/parent'; // 'fork-ipc/parent'

const child = fork(join(__dirname, 'child.js'))

import type { Add } from './child';

const main = async () => {
  await registerChild(child);
  const result = await execute<Add>('test', 'add', 2, 3);
  console.log(`Result is ${result}`);
}

main()
  .then(() => {
    console.log('MAIN execute OK');
  })
  .catch((err) => {
    console.log('MAIN execute FAIL');
    console.log(err);
  })
  .finally(function () {
    process.exit();
  });
