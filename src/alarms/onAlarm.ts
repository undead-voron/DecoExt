import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { alarm: browser.Alarms.Alarm }) => unknown)

const listeners = new Set<(arg: { alarm: browser.Alarms.Alarm }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.alarms.onAlarm.addListener((alarm) => {
    for (const listener of listeners)
      listener({ alarm })
  })
})

const alarmDecoratorInfo = createDecorator<keyof browser.Alarms.Alarm | void>('alarm')

export const alarm = alarmDecoratorInfo.decorator

// map onAlarm data to parameter decorators
function decoratorsHandler(arg: { alarm: browser.Alarms.Alarm }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingAlarmParameters: { index: number, key?: keyof browser.Alarms.Alarm }[] = Reflect.getOwnMetadata(alarmDecoratorInfo.key, constructor, propertyKey) || []

  if (existingAlarmParameters.length) {
    const customArg = []
    for (const { index, key } of existingAlarmParameters) {
      customArg[index] = key ? arg.alarm[key] : arg.alarm
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { alarm: browser.Alarms.Alarm }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(arg, constructor, propertyKey))
  }
}

/**
 * @overview
 *
 * Decorator that handles alarm triggered events
 * Simply calls methods for browser.alarms.onAlarm.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an alarm has elapsed.
 * The method is called with an 'alarm' parameter by default unless parameter decorators are used.
 */
export function onAlarmFired<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
