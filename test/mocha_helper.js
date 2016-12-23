/*
 * global helper for chai.should()
 */
import { inspect } from 'util'
import chai, { should, expect, assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

GLOBAL.should = should()
GLOBAL.expect = expect // to work with 'undefined' - should cant it
GLOBAL.assert = assert

/*
 * for easy inspect
 */
GLOBAL.inspect = (item) => {
  return inspect(item, true, null, true)
}
  