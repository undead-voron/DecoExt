---
sidebar_position: 8
title: Runtime Decorators
---

# Runtime Decorators

The Runtime decorators allow you to easily respond to browser runtime events in your extension services. These decorators provide a clean way to handle extension lifecycle events such as installation, startup, updates, and suspension.

## Method Decorators

### onInstalled

This decorator handles events that fire when the extension is installed or updated, or when Chrome is updated.

```typescript
import { onInstalled, InjectableService } from 'deco-ext';

@InjectableService()
class SetupService {
  @onInstalled()
  handleInstallation(details: browser.Runtime.OnInstalledDetailsType) {
    const { reason, previousVersion } = details;
    
    if (reason === 'install') {
      console.log('Extension was installed for the first time');
      this.setupFirstTimeUser();
    } 
    else if (reason === 'update') {
      console.log(`Extension updated from version ${previousVersion}`);
      this.migrateUserData();
    }
  }
  
  private setupFirstTimeUser() {
    // Initialize default settings
  }
  
  private migrateUserData() {
    // Handle data migration between versions
  }
}
```

With parameter decorator:

```typescript
import { onInstalled, installedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class SetupService {
  @onInstalled()
  handleInstallation(
    @installedDetails('reason') reason: string,
    @installedDetails('previousVersion') previousVersion?: string,
    @installedDetails('temporary') isTemporary?: boolean
  ) {
    if (reason === 'install') {
      console.log('First-time installation');
    } else if (reason === 'update') {
      console.log(`Updated from ${previousVersion}`);
    }
    
    if (isTemporary) {
      console.log('This is a temporary installation (developer mode)');
    }
  }
}
```

The `onInstalled` decorator also accepts filtering options to only execute for specific installation reasons:

```typescript
import { onInstalled, InjectableService } from 'deco-ext';

@InjectableService()
class SetupService {
  // Only runs on first installation
  @onInstalled({ reason: 'install' })
  firstTimeSetup(details: browser.Runtime.OnInstalledDetailsType) {
    console.log('Setting up extension for first time use');
  }
  
  // Only runs on updates
  @onInstalled({ reason: 'update' })
  handleUpdate(details: browser.Runtime.OnInstalledDetailsType) {
    console.log(`Updating from version ${details.previousVersion}`);
  }
  
  // Only runs for temporary installations (during development)
  @onInstalled({ temporary: true })
  devModeSetup(details: browser.Runtime.OnInstalledDetailsType) {
    console.log('Dev mode detected, setting up debugging tools');
  }
}
```

### onBrowserStartup

This decorator handles events that fire when the browser starts up with the extension already installed.

```typescript
import { onBrowserStartup, InjectableService } from 'deco-ext';

@InjectableService()
class StartupService {
  @onBrowserStartup()
  handleBrowserStartup() {
    console.log('Browser has started');
    this.refreshCachedData();
  }
  
  private refreshCachedData() {
    // Refresh any cached data
  }
}
```

### onExtensionSuspend

This decorator handles events that fire when the extension is about to be unloaded, typically when the browser is shutting down.

```typescript
import { onExtensionSuspend, InjectableService } from 'deco-ext';

@InjectableService()
class ShutdownService {
  @onExtensionSuspend()
  handleSuspend() {
    console.log('Extension is being suspended');
    this.saveState();
    this.closeConnections();
  }
  
  private saveState() {
    // Save any unsaved state
  }
  
  private closeConnections() {
    // Close any open database connections or other resources
  }
}
```

### onSuspendCanceled

This decorator handles events that fire when the extension suspension has been canceled.

```typescript
import { onSuspendCanceled, InjectableService } from 'deco-ext';

@InjectableService()
class SuspendService {
  @onSuspendCanceled()
  handleSuspendCanceled() {
    console.log('Extension suspension was canceled');
    this.reopenConnections();
  }
  
  private reopenConnections() {
    // Reopen any connections that were closed during suspend
  }
}
```

### onUpdateAvailable

This decorator handles events that fire when an update for the extension is available.

```typescript
import { onUpdateAvailable, InjectableService } from 'deco-ext';

@InjectableService()
class UpdateService {
  @onUpdateAvailable()
  handleUpdateAvailable(arg: { details: { version: string } }) {
    console.log(`Update available: version ${arg.details.version}`);
    
    // Optionally reload to apply update immediately
    // browser.runtime.reload();
  }
}
```

With parameter decorator:

```typescript
import { onUpdateAvailable, updateDetails, InjectableService } from 'deco-ext';

@InjectableService()
class UpdateService {
  @onUpdateAvailable()
  handleUpdateAvailable(@updateDetails('version') newVersion: string) {
    console.log(`Update available: version ${newVersion}`);
    
    // Show update notification to user
    this.notifyUserAboutUpdate(newVersion);
  }
  
  private notifyUserAboutUpdate(version: string) {
    // Display a notification about the update
  }
}
```

## Parameter Decorators

The Runtime API includes parameter decorators for specific event types:

### installedDetails

Used with `onInstalled` to extract specific properties from the installation details:

```typescript
import { onInstalled, installedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionLifecycle {
  @onInstalled()
  logInstallationDetails(
    @installedDetails('reason') reason: string,
    @installedDetails('previousVersion') prevVersion?: string
  ) {
    console.log(`Installation event: ${reason}`);
    
    if (reason === 'update' && prevVersion) {
      console.log(`Previous version: ${prevVersion}`);
    }
  }
}
```

### updateDetails

Used with `onUpdateAvailable` to extract properties from the update details object:

```typescript
import { onUpdateAvailable, updateDetails, InjectableService } from 'deco-ext';

@InjectableService()
class UpdateService {
  @onUpdateAvailable()
  logUpdate(@updateDetails('version') newVersion: string) {
    console.log(`New version available: ${newVersion}`);
  }
}
```

## Installation Reasons

The `onInstalled` decorator can filter by installation reason:

- `install`: The extension was installed for the first time
- `update`: The extension was updated to a new version
- `chrome_update`: The browser was updated to a new version
- `shared_module_update`: A shared module was updated

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a runtime event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 