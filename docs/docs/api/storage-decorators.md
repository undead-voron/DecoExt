---
sidebar_label: 'Storage Decorators'
---

# Storage Decorators

Decorators for interacting with `browser.storage` events.

## `@onStorageChanged(options)`

A method decorator that triggers when a change in browser storage occurs that matches the specified criteria.

This decorator must be used on methods within a class decorated by `@InjectableService()`.

### Options

*   `storageArea` (required): `browser.storage.AreaName` - The storage area to monitor (e.g., `'local'`, `'sync'`, `'session'`).
*   `key` (optional): `string` - The specific storage key to monitor. If omitted, the decorated method will be triggered for any change in the specified `storageArea`.

### Example

```typescript
import { InjectableService, onStorageChanged, StorageChanges, StorageAreaName, StorageItemChange } from 'your-library-name'; // Replace 'your-library-name'
import browser from 'webextension-polyfill';

@InjectableService()
class StorageWatcherService {
  constructor() {
    // Initialize service
  }

  @onStorageChanged({ storageArea: 'local', key: 'userPreferences' })
  handleUserPreferencesChange(
    @StorageItemChange() itemChange?: browser.storage.StorageChange,
    @StorageAreaName() area?: string
  ) {
    if (itemChange) {
      console.log(`User preferences changed in ${area}:`, itemChange.newValue);
    }
  }

  @onStorageChanged({ storageArea: 'sync' })
  handleAnySyncChange(
    @StorageChanges() changes: { [key: string]: browser.storage.StorageChange },
    @StorageAreaName() area: string
  ) {
    console.log(`Changes in ${area}:`, changes);
    for (const [key, value] of Object.entries(changes)) {
      console.log(`Key '${key}' in sync storage changed. New value:`, value.newValue);
    }
  }
}
```

## Parameter Decorators

These decorators can be used on parameters of methods decorated with `@onStorageChanged`.

### `@StorageChanges()`

Injects the entire `changes` object from the `browser.storage.onChanged` event. This object maps changed keys to their `browser.storage.StorageChange` objects.

*   **Type**: `{ [key: string]: browser.storage.StorageChange }`

### `@StorageAreaName()`

Injects the name of the storage area where the change occurred (e.g., `'local'`, `'sync'`, `'session'`).

*   **Type**: `string`

### `@StorageItemChange()`

Injects the `browser.storage.StorageChange` object for the specific key that was defined in the `@onStorageChanged({ key: '...' })` decorator's options.

*   **Type**: `browser.storage.StorageChange | undefined`
*   **Note**: This will be `undefined` if the `@onStorageChanged` decorator was not configured with a specific `key`, or if the change event that triggered the method did not involve that specific key (though the latter case should typically be filtered by the main decorator).

```
