import browser from 'webextension-polyfill';
import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper';
import { callOnce } from '~/utils';

// Define ParametersForListener at a scope accessible to buildDecoratorAndMethodWrapper call
// if its type parameters need this. For now, we assume 'any' is acceptable at top-level call.
// This might need refinement if buildDecoratorAndMethodWrapper is very specific.
type GenericParametersForListener = {
  allChanges: { [key: string]: browser.storage.StorageChange };
  areaName: browser.storage.AreaName;
  specificChange?: browser.storage.StorageChange;
};

// Call buildDecoratorAndMethodWrapper once at the top level
// Assuming 'decorator' is the PARAMETER decorator factory based on its usage in parameterDecorators.ts
// and 'key' is the metadata symbol/key.
// 'listenerWrapper' is the factory for the core method implementation listener.
const {
  decorator: paramDecoratorFactory, // This is for creating parameter decorators
  listenerWrapper: methodImplListenerFactory, // This creates the core event handling logic for the method
  key: generatedMetadataKey // The metadata key (Symbol or string) used for parameter metadata
} = buildDecoratorAndMethodWrapper<GenericParametersForListener, AllowedListener>('storageChange');

// Export the parameter decorator factory for use in parameterDecorators.ts
export const storageParamFactory = paramDecoratorFactory;

// Type definitions
// GenericParametersForListener was defined before the top-level call
export type AllowedListener =
  | ((changes: { [key: string]: browser.storage.StorageChange }, areaName: browser.storage.AreaName) => any)
  | ((...args: any[]) => any);

export interface StorageOptions {
  storageArea: browser.storage.AreaName;
  key?: string; // This is optionsKey in the function argument
}

// Global Listener Management
type WrappedFunction = (...args: any[]) => any;
const listeners = new Map<browser.storage.AreaName, Map<string | symbol, Set<WrappedFunction>>>();
const DEFAULT_KEY = Symbol('defaultKey'); // Used if no specific optionsKey is provided

const initialListener = callOnce(() => {
  browser.storage.onChanged.addListener((changes, areaName) => {
    console.log(`[DEBUG] Event received: area=${areaName}, changes=${JSON.stringify(changes)}`);
    const areaListeners = listeners.get(areaName); // Ensure areaListeners is defined before logging it
    console.log(`[DEBUG] Current listeners map keys for area '${areaName}':`, areaListeners ? Array.from(areaListeners.keys()).map(k => k.toString()) : 'No listeners for area');
    if (!areaListeners) {
      return;
    }

    // Trigger listeners for specific keys
    for (const eventKey in changes) {
      const keySpecificListeners = areaListeners.get(eventKey);
      if (keySpecificListeners) {
        keySpecificListeners.forEach(listener => {
          console.log(`[DEBUG] Calling listener for specific key '${eventKey}' in area '${areaName}' for method associated with this listener.`);
          listener(changes, areaName); 
        });
      }
    }

    // Trigger listeners for the default key (all changes in the area)
    const defaultKeyListeners = areaListeners.get(DEFAULT_KEY);
    if (defaultKeyListeners) {
      defaultKeyListeners.forEach(listener => {
        console.log(`[DEBUG] Calling listener for DEFAULT_KEY in area '${areaName}' for method associated with this listener.`);
        listener(changes, areaName);
      });
    }
  });
});

// Decorator Implementation
export function onStorageChanged<T extends AllowedListener>({ storageArea, key: optionsKey }: StorageOptions) {
  initialListener(); // Ensure browser.storage.onChanged.addListener is set up

  // This is the actual method decorator function
  return function (
    target: any, // Class prototype for instance methods
    propertyKey: string | symbol, // Method name
    descriptor: TypedPropertyDescriptor<T> // Method's property descriptor
  ): TypedPropertyDescriptor<T> | void {
    const originalMethod = descriptor.value;
    if (typeof originalMethod !== 'function') {
      throw new Error(`@onStorageChanged can only be applied to methods, not ${typeof originalMethod}`);
    }

    // `methodImplListenerFactory` is: (targetClassProto, methodFromDescriptor, propertyKeyStrOrSymbol) => (payloadObject) => Promise<void>
    // It requires the actual method implementation and its context.
    const actualEventHandler = methodImplListenerFactory(target, originalMethod, propertyKey as string);

    // This adapter takes the arguments from browser.storage.onChanged event
    // and calls the actualEventHandler with the structured payload object.
    const adaptingListener = (
      eventChanges: { [key: string]: browser.storage.StorageChange },
      eventAreaName: browser.storage.AreaName
    ) => {
      const payload: GenericParametersForListener = {
        allChanges: eventChanges,
        areaName: eventAreaName,
        specificChange: optionsKey ? eventChanges[optionsKey] : undefined,
      };
      actualEventHandler(payload); // Call with the single payload object
    };

    // Store the adaptingListener
    let areaListeners = listeners.get(storageArea);
    if (!areaListeners) {
      areaListeners = new Map<string | symbol, Set<WrappedFunction>>();
      listeners.set(storageArea, areaListeners);
    }
    const listenKeyToUse = optionsKey || DEFAULT_KEY;
    let keySpecificListeners = areaListeners.get(listenKeyToUse);
    if (!keySpecificListeners) {
      keySpecificListeners = new Set<WrappedFunction>();
      areaListeners.set(listenKeyToUse, keySpecificListeners);
    }
    keySpecificListeners.add(adaptingListener);
    console.log(`[DEBUG] Listener registered: area=${storageArea}, key=${listenKeyToUse.toString()}, method=${propertyKey.toString()}`);

    return descriptor; // Return the original descriptor
  };
}
