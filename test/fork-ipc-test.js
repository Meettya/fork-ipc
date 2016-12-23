/*
 * Test suite for fork-ipc
 */
import Promise from 'bluebird'
import decache from 'decache'
import { fork } from 'child_process'

const childPath = `${__dirname}/fixtures`

console.log(childPath);

describe('Fork IPC', () => {

  let forkIpc, child1, childDelay

  beforeEach(() => {
    forkIpc = require('../src').default
    child1 = fork(`${childPath}/child1.js`)
    childDelay = fork(`${childPath}/child_delay.js`)
  })

  afterEach(() => {
    child1.kill()
    childDelay.kill()
    decache('../src')
  })

  describe('as register services for one child case', () => {
    it('should register one child without any delay', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          return forkIpc.parent.execute('test', 'add', 2, 3)
        }).should.eventually.equal(5)
    })

    it('should register one child with delay on parent and no delay on child', () => {
      return Promise.delay(500)
        .then(() => {
          return forkIpc.parent.registerChild(child1)
        })
        .then(() => {
          return forkIpc.parent.execute('test', 'add', 2, 3)
        }).should.eventually.equal(5)
    })

    it('should register one child without delay on parent and with delay on child', () => {
      return forkIpc.parent.registerChild(childDelay)
        .then(() => {
          return forkIpc.parent.execute('test', 'add', 2, 3)
        }).should.eventually.equal(5)
    })

    it('should register one child with delay on parent and with delay on child too', () => {
      return Promise.delay(600)
        .then(() => {
          return forkIpc.parent.registerChild(childDelay)
        })
        .then(() => {
          return forkIpc.parent.execute('test', 'add', 2, 3)
        }).should.eventually.equal(5)
    })
  })

  describe('as register services for some child case', () => {
    let child2, child1_double

    beforeEach(() => {
      child2 = fork(`${childPath}/child2.js`)
      child1_double = fork(`${childPath}/child1.js`)
    })

    afterEach(() => {
      child2.kill()
      child1_double.kill()
    })

    it('should register two child with no intersection at services', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          return forkIpc.parent.registerChild(child2)
        })
        .then(() => {
          return Promise.all([forkIpc.parent.execute('test', 'add', 2, 3), 
          forkIpc.parent.execute('example', 'add', 10, 20)])
        }).should.eventually.become([5, 30])
    })

    it('should throw error if services has intersection', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          forkIpc.parent.registerChild(child1_double).should.be.rejectedWith(Error)
        })
    })
  })

  describe('as remote service processor', () => {
    it('should process valid sync service', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          return forkIpc.parent.execute('test', 'add', 2, 3)
        }).should.eventually.equal(5)
    })

    it('should process valid async service', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          return forkIpc.parent.execute('test', 'addAsync', 2, 3)
        }).should.eventually.equal(5)
    })

    it('should process invalid sync service', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          return forkIpc.parent.execute('test', 'errorSync', 2, 3)
        }).should.be.rejected
    })

    it('should process invalid async service', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          return forkIpc.parent.execute('test', 'errorAsync', 2, 3)
        }).should.be.rejected
    })

    it('should reject nonexistent service', () => {
      return forkIpc.parent.registerChild(child1)
        .then(() => {
          return forkIpc.parent.execute('test', 'nonexistent', 2, 3)
        }).should.be.rejected
    })

  })

  describe('as child to parent notification', () => {
    let child2

    beforeEach(() => {
      child2 = fork(`${childPath}/child2.js`)
    })

    afterEach(() => {
      child2.kill()
    })

    it('should send notification from child to parent', (done) => {
      const testRes = 10;
      forkIpc.parent.once('emiterBus', (res) => {
        expect(res).to.equal(testRes)
        done()
      })
      forkIpc.parent.registerChild(child2)
        .then(() => {
          forkIpc.parent.execute('example', 'makeEmit', testRes)
        })
    })
  })

  describe('work with losted child', () => {
    let child2

    beforeEach(() => {
      child2 = fork(`${childPath}/child2.js`)
    })

    afterEach(() => {
      child2.kill()
    })

    it('should reject execute if child killed by parent', () => {
      return forkIpc.parent.registerChild(child2)
        .then(() => {
          child2.kill()
          return forkIpc.parent.execute('example', 'add', 2, 3)
        }).should.be.rejected
    })

    it('should allow re-register new child if old killed by parent', () => {
      return forkIpc.parent.registerChild(child2)
        .then(() => {
          child2.kill()
          child2 = fork(`${childPath}/child2.js`)
          return forkIpc.parent.registerChild(child2)
        })
        .then(() => {
          return forkIpc.parent.execute('example', 'add', 2, 3)
        }).should.eventually.equal(5)
    })

    it('should reject execute if child killed by itself', () => {
      return forkIpc.parent.registerChild(child2)
        .then(() => {
          return forkIpc.parent.execute('example', 'doDie')
        })
        .delay(300)
        .then(() => {
          return forkIpc.parent.execute('example', 'add', 2, 3)
        }).should.be.rejected
    })

    it('should allow re-register new child if old killed by itself', () => {
      return forkIpc.parent.registerChild(child2)
        .then(() => {
          return forkIpc.parent.execute('example', 'doDie')
         })
        .delay(300)
        .then(() => {
          child2 = fork(`${childPath}/child2.js`)
          return forkIpc.parent.registerChild(child2)
        })
        .then(() => {
          return forkIpc.parent.execute('example', 'add', 2, 3)
        }).should.eventually.equal(5)
    })

  })

});
