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
  const key = Symbol(description);
  const decorator = (argKey: T) => function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    console.log('[DEBUG] createDecorator target:', target, 'propertyKey:', propertyKey, 'argKey:', argKey);
    if (typeof target !== 'object' && typeof target !== 'function') {
        console.error('[DEBUG] Error: target is not an object or function. Actual type:', typeof target);
    }
    const existingParameters: { index: number, key: T }[] = Reflect.getOwnMetadata(key, target, propertyKey) || [];
    existingParameters.push({ index: parameterIndex, key: argKey });
    Reflect.defineMetadata(key, existingParameters, target, propertyKey);
  };
  return {
    key,
    decorator,
  };
}

export function buildListenerWrapper<T, AllowedListener extends (...args: unknown[]) => unknown>(metadataKey: symbol) {
  const listenerWrapper = (targetClass: any, method: AllowedListener, propertyKey: string | symbol) => async (arg: T): Promise<void> => {
      console.log(`[DEBUG] actualEventHandler: Entered for method ${propertyKey.toString()}`);
      const instanceWrapperConstructor = container.get(targetClass.constructor);
      console.log(`[DEBUG] actualEventHandler: instanceWrapperConstructor found in container: ${!!instanceWrapperConstructor}`);

      if (!instanceWrapperConstructor) {
        console.error(`[DEBUG] actualEventHandler: No instanceWrapperConstructor found in container for ${targetClass.constructor.name}`);
        throw new Error('decorator should be applied on class decorated by "Service" decorator');
      }

      const instance = resolve(instanceWrapperConstructor);
      console.log(`[DEBUG] actualEventHandler: instance resolved: ${!!instance}`);
      console.log(`[DEBUG] actualEventHandler: instance.constructor.name: ${instance?.constructor?.name}`);


      if (instance && instance.init && typeof instance.init === 'function') {
        console.log(`[DEBUG] actualEventHandler: Found instance.init, attempting to call for ${propertyKey.toString()}`);
        try {
          await instance.init();
          console.log(`[DEBUG] actualEventHandler: instance.init() completed for ${propertyKey.toString()}`);
        } catch (e) {
          console.error(`[DEBUG] actualEventHandler: instance.init() threw error for ${propertyKey.toString()}:`, e);
        }
      } else {
        console.log(`[DEBUG] actualEventHandler: instance.init is not found or not a function for ${propertyKey.toString()}`, instance ? typeof instance.init : 'instance is null');
      }
      
      // Call the original method
      const decoratedParametersHandler = createDecoratorHandler<T>(metadataKey); // metadataKey is from buildListenerWrapper's scope
      console.log(`[DEBUG] actualEventHandler: About to call method ${propertyKey.toString()}`);
      method.call(instance, ...decoratedParametersHandler(arg, targetClass, propertyKey));
      console.log(`[DEBUG] actualEventHandler: Method ${propertyKey.toString()} called.`);
  };
  return listenerWrapper;
}

export function buildDecoratorAndMethodWrapper<ParameterKeys, AllowedListener extends (...args: any[]) => any>(key: string) {
  const { key: metadataKey, decorator } = createDecorator<keyof ParameterKeys | void>(key)
  const listenerWrapper = buildListenerWrapper<ParameterKeys, AllowedListener>(metadataKey)

  return { decorator, listenerWrapper, key: metadataKey }
}
