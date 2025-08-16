---
title: Storage Decorators
---

# Storage Decorators

The Storage decorators allow you to easily respond to browser storage change events in your extension services. These decorators provide a clean way to handle changes in local, sync, and session storage areas with powerful filtering and data mapping capabilities.

## Method Decorators

### onStorageChanged

This decorator handles events that fire when data changes in any browser storage area (local, sync, session). It supports filtering by storage domain and specific keys, making it easy to respond only to relevant changes.

#### Listening to all storage changes

```typescript
import { InjectableService, onStorageChanged } from 'deco-ext'

@InjectableService()
class StorageMonitor {
  @onStorageChanged()
  handleAllStorageChanges(data: { changes: Record<string, any>, areaName: string }) {
    console.log('Storage changed:', data.changes, 'in area:', data.areaName)

    // Process all storage changes
    for (const [key, change] of Object.entries(data.changes)) {
      console.log(`${key} changed from ${change.oldValue} to ${change.newValue}`)
    }
  }
}
```

#### Filtering by storage domain

```typescript
import { InjectableService, onStorageChanged } from 'deco-ext'

@InjectableService()
class SettingsService {
  // Listen only to local storage changes
  @onStorageChanged({ domain: 'local' })
  handleLocalStorageChanges(data: { changes: Record<string, any>, areaName: string }) {
    console.log('Local storage changed:', data.changes)
    this.updateLocalCache(data.changes)
  }

  // Listen only to sync storage changes
  @onStorageChanged({ domain: 'sync' })
  handleSyncStorageChanges(data: { changes: Record<string, any>, areaName: string }) {
    console.log('Sync storage changed:', data.changes)
    this.syncWithCloud(data.changes)
  }

  // Listen only to session storage changes
  @onStorageChanged({ domain: 'session' })
  handleSessionStorageChanges(data: { changes: Record<string, any>, areaName: string }) {
    console.log('Session storage changed:', data.changes)
    this.updateSessionState(data.changes)
  }

  private updateLocalCache(changes: Record<string, any>) {
    // Update local cache with changes
  }

  private syncWithCloud(changes: Record<string, any>) {
    // Sync changes with cloud storage
  }

  private updateSessionState(changes: Record<string, any>) {
    // Update session-specific state
  }
}
```

#### Filtering by specific keys

```typescript
import { InjectableService, onStorageChanged } from 'deco-ext'

@InjectableService()
class UserPreferencesService {
  // Listen only to changes of the 'settings' key
  @onStorageChanged({ key: 'settings' })
  handleSettingsChange(data: { changes: Record<string, any>, areaName: string }) {
    console.log('Settings changed:', data.changes.settings)
    this.applyNewSettings(data.changes.settings.newValue)
  }

  // Listen to changes of 'theme' key in local storage only
  @onStorageChanged({ domain: 'local', key: 'theme' })
  handleThemeChange(data: { changes: Record<string, any>, areaName: string }) {
    console.log('Theme changed:', data.changes.theme)
    this.updateTheme(data.changes.theme.newValue)
  }

  // Listen to user preferences in sync storage
  @onStorageChanged({ domain: 'sync', key: 'userPreferences' })
  handleUserPreferencesChange(data: { changes: Record<string, any>, areaName: string }) {
    const change = data.changes.userPreferences
    if (this.validatePreferences(change.newValue)) {
      this.applyUserPreferences(change.newValue)
    }
    else {
      console.error('Invalid user preferences received:', change.newValue)
    }
  }

  private applyNewSettings(settings: any) {
    // Apply new settings to the application
  }

  private updateTheme(theme: string) {
    // Update the application theme
  }

  private validatePreferences(prefs: any): boolean {
    // Validate user preferences
    return prefs && typeof prefs === 'object'
  }

  private applyUserPreferences(prefs: any) {
    // Apply user preferences
  }
}
```

#### Using parameter decorators for data mapping

```typescript
import {
  InjectableService,
  onStorageChanged,
  storageAreaName,
  storageChanges,
  storageChangeValue
} from 'deco-ext'

@InjectableService()
class AdvancedStorageService {
  // Map specific parts of the change data to parameters
  @onStorageChanged({ domain: 'local', key: 'userSettings' })
  handleUserSettingsChange(
    @storageChangeValue('newValue') newSettings: any,
    @storageChangeValue('oldValue') oldSettings: any,
    @storageAreaName() areaName: string
  ) {
    console.log('User settings changed from:', oldSettings, 'to:', newSettings, 'in:', areaName)
    this.migrateSettings(oldSettings, newSettings)
  }

  // Map the entire changes object
  @onStorageChanged({ domain: 'sync' })
  handleSyncChanges(
    @storageChanges() changes: Record<string, any>,
    @storageAreaName() area: string
  ) {
    console.log('Sync changes:', changes, 'in area:', area)
    this.processSyncChanges(changes)
  }

  // Map a specific change by key
  @onStorageChanged()
  handleSpecificKeyChange(
    @storageChanges('preferences') preferencesChange: any,
    @storageAreaName() area: string
  ) {
    if (preferencesChange) {
      console.log('Preferences changed:', preferencesChange, 'in:', area)
      this.updatePreferences(preferencesChange.newValue)
    }
  }

  private migrateSettings(oldSettings: any, newSettings: any) {
    // Handle settings migration
  }

  private processSyncChanges(changes: Record<string, any>) {
    // Process sync storage changes
  }

  private updatePreferences(preferences: any) {
    // Update application preferences
  }
}
```

#### Complex configuration management example

```typescript
import {
  InjectableService,
  onStorageChanged,
  storageAreaName,
  storageChanges,
  storageChangeValue
} from 'deco-ext'

@InjectableService()
class ConfigurationService {
  private config: any = {}

  async init() {
    // Load initial configuration
    this.config = await browser.storage.local.get()
  }

  // Handle all configuration changes
  @onStorageChanged({ domain: 'local' })
  handleConfigChange(
    @storageChanges() changes: Record<string, any>,
    @storageAreaName() area: string
  ) {
    // Update local config cache
    for (const [key, change] of Object.entries(changes)) {
      this.config[key] = change.newValue
    }
    console.log('Configuration updated:', this.config)
    this.notifyConfigurationChange(changes)
  }

  // Handle specific feature toggles
  @onStorageChanged({ domain: 'local', key: 'featureFlags' })
  handleFeatureFlags(
    @storageChangeValue('newValue') newFlags: Record<string, boolean>,
    @storageChangeValue('oldValue') oldFlags: Record<string, boolean>
  ) {
    const changedFlags = this.getChangedFlags(oldFlags || {}, newFlags || {})
    console.log('Feature flags changed:', changedFlags)
    this.applyFeatureChanges(changedFlags)
  }

  // Handle user preferences with validation
  @onStorageChanged({ domain: 'sync', key: 'userPreferences' })
  handleUserPreferences(
    @storageChangeValue('newValue') newPrefs: any
  ) {
    if (this.validatePreferences(newPrefs)) {
      this.applyUserPreferences(newPrefs)
    }
    else {
      console.error('Invalid user preferences received:', newPrefs)
      this.revertToDefaultPreferences()
    }
  }

  private getChangedFlags(oldFlags: Record<string, boolean>, newFlags: Record<string, boolean>) {
    const changed: Record<string, { old: boolean, new: boolean }> = {}
    for (const [key, newValue] of Object.entries(newFlags)) {
      if (oldFlags[key] !== newValue) {
        changed[key] = { old: oldFlags[key], new: newValue }
      }
    }
    return changed
  }

  private applyFeatureChanges(changes: Record<string, any>) {
    // Apply feature flag changes
    for (const [feature, change] of Object.entries(changes)) {
      if (change.new) {
        this.enableFeature(feature)
      }
      else {
        this.disableFeature(feature)
      }
    }
  }

  private validatePreferences(prefs: any): boolean {
    // Add your validation logic here
    return prefs && typeof prefs === 'object'
  }

  private applyUserPreferences(prefs: any) {
    // Apply user preferences
  }

  private revertToDefaultPreferences() {
    // Revert to default preferences
  }

  private notifyConfigurationChange(changes: Record<string, any>) {
    // Notify other parts of the application about configuration changes
  }

  private enableFeature(feature: string) {
    // Enable a specific feature
  }

  private disableFeature(feature: string) {
    // Disable a specific feature
  }
}
```

## Filtering Events

All storage decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives a single `StorageChangeData` object containing `{ changes: Record<string, browser.Storage.StorageChange>, areaName: string }` and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onStorageChanged, InjectableService } from 'deco-ext';

@InjectableService()
class StorageFilterService {
  // Only handle changes to specific keys
  @onStorageChanged({ 
    filter: (data) => 'userSettings' in data.changes || 'theme' in data.changes 
  })
  handleSettingsChanges(data: { changes: { [key: string]: browser.Storage.StorageChange }, areaName: string }) {
    console.log('Settings changed:', Object.keys(data.changes));
    this.updateUISettings(data.changes);
  }

  // Only handle local storage changes (not sync)
  @onStorageChanged({ 
    filter: (data) => data.areaName === 'local' 
  })
  handleLocalStorageChanges(data: { changes: { [key: string]: browser.Storage.StorageChange }, areaName: string }) {
    console.log('Local storage changes:', data.changes);
    this.processLocalChanges(data.changes);
  }

  // Only handle sync storage changes
  @onStorageChanged({ 
    filter: (data) => data.areaName === 'sync' 
  })
  handleSyncStorageChanges(data: { changes: { [key: string]: browser.Storage.StorageChange }, areaName: string }) {
    console.log('Sync storage changes:', data.changes);
    this.syncSettingsAcrossDevices(data.changes);
  }

  private updateUISettings(changes: { [key: string]: browser.Storage.StorageChange }) {
    // Update UI based on settings changes
  }

  private processLocalChanges(changes: { [key: string]: browser.Storage.StorageChange }) {
    // Handle local storage changes
  }

  private syncSettingsAcrossDevices(changes: { [key: string]: browser.Storage.StorageChange }) {
    // Handle cross-device synchronization
  }
}
```

### Advanced Filtering Examples

```typescript
import { onStorageChanged, InjectableService } from 'deco-ext';

// Module-level configuration (accessible to filters)
const watchedKeys = ['userData', 'preferences', 'cache'];
const sensitiveKeys = ['apiKey', 'tokens', 'credentials'];

// Helper function for security verification
async function verifySecurityContext(): Promise<boolean> {
  // Verify that the change is happening in a secure context
  return true; // Example implementation
}

@InjectableService()
class AdvancedStorageService {
  // Filter changes to watched keys only
  @onStorageChanged({ 
    filter: (data) => {
      return Object.keys(data.changes).some(key => watchedKeys.includes(key));
    }
  })
  handleWatchedKeyChanges(data: { changes: { [key: string]: browser.Storage.StorageChange }, areaName: string }) {
    console.log('Watched keys changed:', Object.keys(data.changes));
    this.processImportantChanges(data.changes);
  }

  // Filter sensitive data changes with additional security checks
  @onStorageChanged({ 
    filter: async (data) => {
      const hasSensitiveChanges = Object.keys(data.changes).some(key => 
        sensitiveKeys.includes(key)
      );
      
      if (!hasSensitiveChanges) return false;
      
      // Additional security check
      const isAuthorized = await verifySecurityContext();
      return isAuthorized;
    }
  })
  handleSensitiveDataChanges(data: { changes: { [key: string]: browser.Storage.StorageChange }, areaName: string }) {
    console.log('Sensitive data changed - processing securely');
    this.securelyProcessChanges(data.changes);
  }

  // Filter based on change type (additions vs removals vs updates)
  @onStorageChanged({ 
    filter: (data) => {
      // Only handle actual value changes (not just additions or removals)
      return Object.values(data.changes).some(change => 
        change.oldValue !== undefined && change.newValue !== undefined
      );
    }
  })
  handleValueUpdates(data: { changes: { [key: string]: browser.Storage.StorageChange }, areaName: string }) {
    console.log('Values updated (not added/removed):', data.changes);
    this.trackValueChanges(data.changes);
  }

  private processImportantChanges(changes: { [key: string]: browser.Storage.StorageChange }) {
    // Process changes to important keys
  }

  private securelyProcessChanges(changes: { [key: string]: browser.Storage.StorageChange }) {
    // Handle sensitive data changes with extra security
  }

  private trackValueChanges(changes: { [key: string]: browser.Storage.StorageChange }) {
    // Track changes for analytics or debugging
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onStorageChanged, storageChanges, storageAreaName, InjectableService } from 'deco-ext';

@InjectableService()
class StorageTrackingService {
  @onStorageChanged({ 
    filter: (data) => data.areaName === 'sync' && 'userProfile' in data.changes
  })
  trackUserProfileSync(
    @storageChanges('userProfile') profileChange: browser.Storage.StorageChange | undefined,
    @storageAreaName() area: string
  ) {
    if (profileChange) {
      console.log(`User profile synced in ${area}:`, profileChange.newValue);
      this.updateUserInterface(profileChange.newValue);
    }
  }

  private updateUserInterface(newProfile: any) {
    // Update UI with new profile data
  }
}
```

## Parameter Decorators

### storageChanges

Used with `onStorageChanged` to extract the changes object or a specific change by key:

```typescript
import { InjectableService, onStorageChanged, storageChanges } from 'deco-ext'

@InjectableService()
class StorageProcessor {
  @onStorageChanged({ domain: 'local' })
  processChanges(
    @storageChanges() allChanges: Record<string, any>,
    @storageChanges('settings') settingsChange: any,
    @storageChanges('theme') themeChange: any
  ) {
    console.log('All changes:', allChanges)

    if (settingsChange) {
      console.log('Settings changed:', settingsChange)
    }

    if (themeChange) {
      console.log('Theme changed:', themeChange)
    }
  }
}
```

### storageAreaName

Used with `onStorageChanged` to extract the storage area name ('local', 'sync', 'session'):

```typescript
import { InjectableService, onStorageChanged, storageAreaName } from 'deco-ext'

@InjectableService()
class StorageLogger {
  @onStorageChanged()
  logStorageArea(@storageAreaName() area: string) {
    console.log(`Storage change occurred in: ${area}`)

    if (area === 'sync') {
      this.handleSyncStorageChange()
    }
    else if (area === 'local') {
      this.handleLocalStorageChange()
    }
  }

  private handleSyncStorageChange() {
    // Handle sync storage specific logic
  }

  private handleLocalStorageChange() {
    // Handle local storage specific logic
  }
}
```

### storageChangeValue

Used with `onStorageChanged` to extract specific values from storage changes:

```typescript
import { InjectableService, onStorageChanged, storageChangeValue } from 'deco-ext'

@InjectableService()
class ValueTracker {
  @onStorageChanged({ key: 'userSettings' })
  trackValueChanges(
    @storageChangeValue('oldValue') oldValue: any,
    @storageChangeValue('newValue') newValue: any,
    @storageChangeValue() fullChange: any
  ) {
    console.log('Old value:', oldValue)
    console.log('New value:', newValue)
    console.log('Full change object:', fullChange)

    // Analyze the change
    this.analyzeChange(oldValue, newValue)
  }

  private analyzeChange(oldValue: any, newValue: any) {
    // Analyze what changed between old and new values
  }
}
```

## Storage Change Object

The storage change object passed to decorated methods contains:

- `changes`: A record of changed keys, where each value is a `StorageChange` object
- `areaName`: The storage area where the change occurred ('local', 'sync', 'session')

Each `StorageChange` object includes:

- `oldValue`: The previous value (undefined if the key was added)
- `newValue`: The new value (undefined if the key was removed)

## Filtering Options

The `onStorageChanged` decorator accepts the following filtering options:

- `domain`: Filter by storage domain ('local', 'sync', 'session')
- `key`: Filter by specific storage key

These options can be combined to create highly specific listeners:

```typescript
// Listen to theme changes in local storage only
@onStorageChanged({ domain: 'local', key: 'theme' })

// Listen to all changes in sync storage
@onStorageChanged({ domain: 'sync' })

// Listen to settings changes in any storage area
@onStorageChanged({ key: 'settings' })

// Listen to all storage changes
@onStorageChanged()
```

## Working with Browser Storage

While the decorator handles event subscription, you'll need to read and write storage data using the Chrome Storage API:

```typescript
import browser from 'webextension-polyfill'

// Reading from storage
const data = await browser.storage.local.get(['settings', 'theme'])
const allLocalData = await browser.storage.local.get()

// Writing to storage
await browser.storage.local.set({
  settings: { darkMode: true },
  theme: 'dark'
})

// Removing from storage
await browser.storage.local.remove(['oldKey'])
await browser.storage.local.clear() // Remove all data

// Sync storage works the same way
await browser.storage.sync.set({ userPreferences: { language: 'en' } })
const syncData = await browser.storage.sync.get(['userPreferences'])
```

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered for storage changes, and then efficiently routes events to the appropriate decorated methods based on filtering criteria. When storage changes occur:

1. The event is received by the single registered browser API listener
2. Changes are filtered based on domain and key criteria
3. For each matching handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the storage data is transformed accordingly
   - The method is called with the appropriate parameters

The decorator can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.

## Performance Considerations

- **Efficient Filtering**: The decorator uses a Map-based system to organize listeners by domain/key combinations, ensuring minimal overhead
- **Single Listener**: Only one browser storage listener is registered regardless of how many decorated methods you have
- **Lazy Initialization**: Class instances are only resolved when storage changes occur
- **Memory Efficient**: Uses Sets to manage multiple listeners per filter combination

## Best Practices

1. **Use Specific Filters**: When possible, use domain and key filters to reduce unnecessary method calls
2. **Validate Data**: Always validate storage data before using it, as it can be modified by other parts of your extension or even other extensions
3. **Handle Errors**: Wrap storage operations in try-catch blocks to handle potential errors gracefully
4. **Debounce Rapid Changes**: If you expect rapid storage changes, consider debouncing your handlers to improve performance
5. **Clean Up Resources**: Use storage change events to clean up resources when data is removed

```typescript
@InjectableService()
class BestPracticesExample {
  @onStorageChanged({ domain: 'local', key: 'settings' })
  handleSettingsChange(@storageChangeValue('newValue') newSettings: any) {
    try {
      // Validate the data
      if (!this.isValidSettings(newSettings)) {
        console.error('Invalid settings received:', newSettings)
        return
      }

      // Apply the settings
      this.applySettings(newSettings)
    }
    catch (error) {
      console.error('Error handling settings change:', error)
    }
  }

  private isValidSettings(settings: any): boolean {
    return settings && typeof settings === 'object'
  }

  private applySettings(settings: any) {
    // Apply validated settings
  }
}
```
