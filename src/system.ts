import { getChildrens } from '@Lib/child'
import { getChildrensGrants } from '@Lib/parent'
import { getProcessors } from '@Lib/processor'
import { getRequestQueue } from '@Lib/requests'
import { getIdConter } from '@Lib/utils'

/*
 * For diagnostic
 */
export const diagnostic = {
  childrens: getChildrens(),
  childrensGrants: getChildrensGrants(),
  idCounter: getIdConter(),
  processors: getProcessors(),
  requestQueue: getRequestQueue(),
}
