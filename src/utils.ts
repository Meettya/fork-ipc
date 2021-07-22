let idCounter = 0;

/*
 * Simpy check is Object (plain)
 */
export const isPlainObject = (val: any) => (
    val instanceof Object && val.constructor === Object
)

/*
 * Return new request ID.
 * Its seems simply increment ok
 */
export const getID = (prefix: string) => {
    idCounter += 1
    return `${prefix}${idCounter}`
}

/*
 * For diagnostic
 */
export const getIdConter = () => idCounter

/*
 * Wrapper for promiseTry
 */
export const promiseTry = (func: Function) => (
    new Promise((resolve) => resolve(func()))
)
