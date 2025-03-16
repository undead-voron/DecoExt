/**
 * @overview
 *
 * Global container for services registration
 */
export default new Map<{ new (...args: any[]): any }, any>()
