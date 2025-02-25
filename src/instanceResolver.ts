import container from './injectablesContainer'

/**
 * @overview
 *
 * Resolver for services that takes care of resolving constructor dependencies as well.
 */
export function resolve(target: { new (...args: any[]): any }): InstanceType<typeof target> {
  const params = Reflect.getMetadata('design:paramtypes', target) ?? []
  if (!params)
    console.error('target', target)

  const ResolvedWrapper = container.get(target) ?? target
  return new ResolvedWrapper(...params.map(resolve))
}
