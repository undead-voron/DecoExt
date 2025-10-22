import container from './injectablesContainer'

/**
 * @overview
 *
 * Resolver for services that takes care of resolving constructor dependencies as well.
 */
export function resolve<T extends { new(...args: any[]): any }>(target: T): InstanceType<T> & { init: () => Promise<void> } {
  const params = Reflect.getMetadata('design:paramtypes', target) ?? []
  if (!params)
    console.error('target', target)

  const ResolvedWrapper = container.get(target) ?? target
  return new ResolvedWrapper(...params.map(resolve))
}
