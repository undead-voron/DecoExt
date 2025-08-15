import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((alarm: browser.Alarms.Alarm) => unknown)

const listeners = new Set<(alarm: browser.Alarms.Alarm) => Promise<void>>()
const namedListeners = new Map<string, Set<AllowedListener>>()

const createInitialListener = callOnce(() => {
  browser.alarms.onAlarm.addListener((alarm) => {
    const alarmListeners = namedListeners.get(alarm.name)

    if (alarmListeners) {
      for (const listener of alarmListeners) {
        listener(alarm)
      }
    }

    for (const listener of listeners)
      listener(alarm)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.Alarms.Alarm, AllowedListener>('alarmInfo')

export const alarmDetails = decorator

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
export function onAlarmFired<T extends AllowedListener>({ name, filter }: { name?: string, filter?: (alarm: browser.Alarms.Alarm) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    const listener = listenerWrapper(target, descriptor.value as T, propertyKey, { filter })
    if (name) {
      if (!namedListeners.has(name)) {
        namedListeners.set(name, new Set())
      }
      namedListeners.get(name)!.add(listener)
    }
    else {
      listeners.add(listener)
    }
  }
}
