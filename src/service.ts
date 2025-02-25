import container from './injectablesContainer'
import { resolve } from './instanceResolver'
import 'reflect-metadata'

enum ClassInstanceStates {
  NOT_INITIALIZED,
  INITIALIZED,
}

/**
 * @overview
 *
 * Creates only single instance of a class.
 * Internaly resolve construtor dependencies.
 * Invokes 'init' method under the hood.
 * Allows class instance to be injected into other service instances.
 */
export function InjectableService() {
  return <Result extends object, T extends { new (...args: any[]): Result }>(
    constructor: T,
  ): ConstructorParameters<T> extends [] ? T : never => {
    const params = Reflect.getMetadata('design:paramtypes', constructor)

    let instance: Result | undefined

    const wrapper = new Proxy(constructor, {
      construct(target): Result {
        if (!instance) {
          const parameters = Reflect.getMetadata('design:paramtypes', wrapper) ?? []
          const resolvedParameters = parameters.map(resolve)
          // eslint-disable-next-line ts/ban-ts-comment
          // @ts-expect-error
          class InitializableInstance extends target {
            private classInstanceState: ClassInstanceStates = ClassInstanceStates.NOT_INITIALIZED
            private initializableInitPromise: null | Promise<unknown[]> = null

            async init(): Promise<void> {
              if (this.initializableInitPromise)
                await this.initializableInitPromise

              if ([ClassInstanceStates.INITIALIZED].includes(this.classInstanceState))
                return

              const parametersPromises = resolvedParameters
                // eslint-disable-next-line ts/no-unsafe-function-type
                .map((param: { init?: Function }) => {
                  if (param.init && typeof param.init === 'function')
                    return param.init()

                  else
                    return undefined
                })
                .filter(Boolean)
              // eslint-disable-next-line ts/ban-ts-comment
              // @ts-expect-error
              if (super.init && typeof super.init === 'function')
              // eslint-disable-next-line ts/ban-ts-comment
              // @ts-expect-error
                this.initializableInitPromise = Promise.all([super.init(), ...parametersPromises])

              else
                this.initializableInitPromise = Promise.all(parametersPromises)

              await this.initializableInitPromise
              this.initializableInitPromise = null
              this.classInstanceState = ClassInstanceStates.INITIALIZED
            }
          }
          instance = new InitializableInstance(...resolvedParameters)
        }
        return instance
      },
    }) as ConstructorParameters<T> extends [] ? T : never

    Reflect.defineMetadata('design:paramtypes', params, wrapper)
    container.set(constructor, wrapper)

    return wrapper
  }
}
