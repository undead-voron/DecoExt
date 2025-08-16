import container from '~/injectablesContainer'
import { resolve } from '~/instanceResolver'

/**
 * Factory for creating parameter decorator handler that maps data for method parameters
 */
export function createDecoratorHandler<T>(metadataKey: symbol) {
  return (arg: T, constructor: any, propertyKey: string | symbol): Array<any> => {
    const existingDecoratedParameters: { index: number, key?: string & keyof typeof arg }[] = Reflect.getOwnMetadata(metadataKey, constructor, propertyKey) || []
    if (existingDecoratedParameters.length) {
      const customArgs = []
      for (const { index, key } of existingDecoratedParameters)
        customArgs[index] = key ? arg[key] : arg
      return customArgs
    }
    else {
      return [arg]
    }
  }
}

/**
 * Factory for creating decorator and a key for retriving data from Reflect
 */
export function createDecorator<T>(description: string) {
  const key = Symbol(description)
  const decorator = (argKey: T) => function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingParameters: { index: number, key: T }[] = Reflect.getOwnMetadata(key, target, propertyKey) || []
    existingParameters.push({ index: parameterIndex, key: argKey })
    Reflect.defineMetadata(key, existingParameters, target, propertyKey)
  }
  return {
    key,
    decorator,
  }
}

export function buildListenerWrapper<T, AllowedListener extends (...args: unknown[]) => unknown>(metadataKey: symbol) {
  const decoratedParametersHandler = createDecoratorHandler<T>(metadataKey)
  const listenerWrapper = (targetClass: any, method: AllowedListener, propertyKey: string | symbol, options: { filter?: (arg: T) => boolean | Promise<boolean> } = {}) => async (arg: T): Promise<void> => {
    // get class wrapper from classes container
    const instanceWrapperConstructor = container.get(targetClass.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(arg))) {
      return
    }

    // resolve class to get single instance of classp
    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    // call method only after class instance is resolved and all dependencies were resolved and initialized
    method.call(instance, ...decoratedParametersHandler(arg, targetClass, propertyKey))
  }
  return listenerWrapper
}

export function buildDecoratorAndMethodWrapper<ParameterKeys, AllowedListener extends (...args: any[]) => any>(key: string) {
  const { key: metadataKey, decorator } = createDecorator<keyof ParameterKeys | void>(key)
  const listenerWrapper = buildListenerWrapper<ParameterKeys, AllowedListener>(metadataKey)

  return { decorator, listenerWrapper, key: metadataKey }
}
