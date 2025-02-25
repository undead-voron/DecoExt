import browser from 'webextension-polyfill'

import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

import { buildCronJobName } from './buildCronJobName'
import { createCronJob } from './createCronJob'

type AllowedListener = (() => unknown) | ((arg: { details: browser.Alarms.Alarm }) => unknown)

const listeners = new Map<string, (details: browser.Alarms.Alarm) => Promise<void>>()

// TODO: consider moving it into a function that will be invoked at a moment of decorator creation
browser.alarms?.onAlarm.addListener((details: browser.Alarms.Alarm) => {
  const listener = listeners.get(details.name)
  if (listener)
    listener(details)
})

function listenerWrapper(constructor: any, method: AllowedListener) {
  return async (details: browser.Alarms.Alarm): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, { details })
  }
}

/**
 * @overview
 *
 * Decorator that runs method periodicly
 * Calls methods for browser.alarms under the hood
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is scheduled to be inviked periodicly.
 */
export function cronJob<T extends AllowedListener>(arg: { periodInMinutes: number, name?: string }) {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    const cronName = arg.name || buildCronJobName(target, propertyKey)
    // check if listener already exists
    if (listeners.get(cronName))
      throw new Error(`cron job with name '${cronName}' already exists. Name should be unique`)

    listeners.set(cronName, listenerWrapper(target.constructor, descriptor.value as T))

    createCronJob(cronName, { periodInMinutes: arg.periodInMinutes })
  }
}
// TODO: add 'runOnStart' property to config object in order to call method instantly after the install
