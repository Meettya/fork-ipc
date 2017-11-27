/*
 * global helper for chai.should()
 */
import { inspect } from 'util'
import chai, { should, expect, assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

global.should = should()
global.expect = expect // to work with 'undefined' - should cant it
global.assert = assert

/*
 * for easy inspect
 */
global.inspect = (item) => {
  return inspect(item, true, null, true)
}
