let idCounter = 0

/*
 * Simpy check is Object (plain)
 */
export const isPlainObject = (val: any): boolean => (
  val instanceof Object && val.constructor === Object
)

/*
 * Return new request ID.
 * Its seems simply increment ok
 */
export const getID = (prefix: string): string => {
  idCounter += 1
  return `${prefix}${idCounter}`
}

/*
 * For diagnostic
 */
export const getIdConter = (): number => idCounter

/*
 * Wrapper for promiseTry
 */
export const promiseTry = async (func: Function): Promise<any> => (
  await new Promise((resolve) => resolve(func()))
)
