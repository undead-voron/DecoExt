export function buildCronJobName(target: any, propertyKey: string | symbol): string {
  // build alarm name from class name and method name
  const className = target.name || target.constructor?.name
  const methodName = propertyKey

  if (typeof methodName !== 'string')
    throw new Error('Method name must be a string')

  if (!className)
    throw new Error('\'cron\' decorator must be applied on a method of a named class')

  return `${className}.${methodName}`
}
