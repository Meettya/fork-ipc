import { servicesAnnouncement } from '../dist/child'; // 'fork-ipc/child'

export type Add = (a: number, b: number) => number

const add: Add = (a, b) => {
  return a + b
}

servicesAnnouncement('test', { add });
