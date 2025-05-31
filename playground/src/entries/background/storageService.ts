/* eslint-disable no-console */
import {
  InjectableService,
  onStorageChanged,
  storageAreaName,
  storageChanges,
  storageChangeValue,
} from 'deco-ext'

@InjectableService()
export class StorageExampleService {
  private config: any = {}

  async init() {
    console.log('StorageExampleService initialized')
  }

  // Listen to all storage changes
  @onStorageChanged()
  handleAllStorageChanges(data: any) {
    console.log('Storage changed:', data.changes, 'in area:', data.areaName)
  }

  // Listen only to local storage changes
  @onStorageChanged({ domain: 'local' })
  handleLocalStorageChanges(data: any) {
    console.log('Local storage changed:', data.changes)
  }

  // Listen only to sync storage changes
  @onStorageChanged({ domain: 'sync' })
  handleSyncStorageChanges(data: any) {
    console.log('Sync storage changed:', data.changes)
  }

  // Listen only to changes of the 'settings' key
  @onStorageChanged({ key: 'settings' })
  handleSettingsChange(data: any) {
    console.log('Settings changed:', data.changes.settings)
  }

  // Listen to changes of 'theme' key in local storage only
  @onStorageChanged({ domain: 'local', key: 'theme' })
  handleThemeChange(data: any) {
    console.log('Theme changed:', data.changes.theme)
  }

  // Using parameter decorators to map specific data
  @onStorageChanged({ domain: 'local', key: 'userSettings' })
  handleUserSettingsChange(
    @storageChangeValue('newValue') newSettings: any,
    @storageChangeValue('oldValue') oldSettings: any,
    @storageAreaName() areaName: string,
  ) {
    console.log('User settings changed from:', oldSettings, 'to:', newSettings, 'in:', areaName)
  }

  // Map the entire changes object
  @onStorageChanged({ domain: 'sync' })
  handleSyncChanges(
    @storageChanges() changes: Record<string, any>,
    @storageAreaName() area: string,
  ) {
    console.log('Sync changes:', changes, 'in area:', area)
  }

  // Map a specific change by key
  @onStorageChanged()
  handleSpecificKeyChange(
    @storageChanges('preferences') preferencesChange: any,
    @storageAreaName() _area: string,
  ) {
    if (preferencesChange) {
      console.log('Preferences changed:', preferencesChange, 'in:', _area)
    }
  }

  // Complex example with configuration management
  @onStorageChanged({ domain: 'local' })
  handleConfigChange(
    @storageChanges() changes: Record<string, any>,
    @storageAreaName() _area: string,
  ) {
    // Update local config cache
    for (const [key, change] of Object.entries(changes)) {
      this.config[key] = change.newValue
    }
    console.log('Configuration updated:', this.config)
  }

  // Handle feature flags with validation
  @onStorageChanged({ domain: 'local', key: 'featureFlags' })
  handleFeatureFlags(
    @storageChangeValue('newValue') newFlags: Record<string, boolean>,
    @storageChangeValue('oldValue') oldFlags: Record<string, boolean>,
  ) {
    const changedFlags = this.getChangedFlags(oldFlags || {}, newFlags || {})
    console.log('Feature flags changed:', changedFlags)
    this.applyFeatureChanges(changedFlags)
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
    console.log('Applying feature changes:', changes)
  }
}
