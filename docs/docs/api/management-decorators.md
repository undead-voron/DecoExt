---
title: Management Decorators
---

# Management Decorators

The Management decorators allow you to easily respond to browser extension management events in your extension service. These decorators provide a clean way to track when extensions are installed, uninstalled, enabled, or disabled.

## Method Decorators

### onExtensionInstalled

This decorator handles events that fire when an extension is installed.

```typescript
import { onExtensionInstalled, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionInstalled()
  handleInstallation(info: browser.Management.ExtensionInfo) {
    console.log(`Extension installed: ${info.name} (${info.id})`);
    console.log(`Version: ${info.version}`);
    console.log(`Type: ${info.type}`);
  }
}
```

With parameter decorator:

```typescript
import { onExtensionInstalled, extensionInfo, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionInstalled()
  handleInstallation(
    @extensionInfo('id') id: string,
    @extensionInfo('name') name: string,
    @extensionInfo('version') version: string
  ) {
    console.log(`New extension: ${name} (${id}) version ${version}`);
  }
}
```

### onExtensionUninstalled

This decorator handles events that fire when an extension is uninstalled.

```typescript
import { onExtensionUninstalled, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionUninstalled()
  handleUninstallation(arg: { id: string }) {
    console.log(`Extension uninstalled: ${arg.id}`);
    this.cleanupDataForExtension(arg.id);
  }
  
  private cleanupDataForExtension(extensionId: string) {
    // Clean up any data related to the uninstalled extension
  }
}
```

With parameter decorator:

```typescript
import { onExtensionUninstalled, extensionId, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionUninstalled()
  handleUninstallation(@extensionId('id') id: string) {
    console.log(`Extension uninstalled: ${id}`);
    this.cleanupDataForExtension(id);
  }
  
  private cleanupDataForExtension(extensionId: string) {
    // Clean up any data related to the uninstalled extension
  }
}
```

### onExtensionEnabled

This decorator handles events that fire when an extension is enabled.

```typescript
import { onExtensionEnabled, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionEnabled()
  handleEnabled(info: browser.Management.ExtensionInfo) {
    console.log(`Extension enabled: ${info.name} (${info.id})`);
    console.log(`Type: ${info.type}`);
    console.log(`Homepage URL: ${info.homepageUrl}`);
  }
}
```

With parameter decorator:

```typescript
import { onExtensionEnabled, extensionInfo, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionEnabled()
  handleEnabled(
    @extensionInfo('id') id: string,
    @extensionInfo('name') name: string
  ) {
    console.log(`Extension enabled: ${name} (${id})`);
  }
}
```

### onExtensionDisabled

This decorator handles events that fire when an extension is disabled.

```typescript
import { onExtensionDisabled, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionDisabled()
  handleDisabled(info: browser.Management.ExtensionInfo) {
    console.log(`Extension disabled: ${info.name} (${info.id})`);
    console.log(`Type: ${info.type}`);
  }
}
```

With parameter decorator:

```typescript
import { onExtensionDisabled, extensionInfo, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionMonitor {
  @onExtensionDisabled()
  handleDisabled(
    @extensionInfo('id') id: string,
    @extensionInfo('name') name: string
  ) {
    console.log(`Extension disabled: ${name} (${id})`);
  }
}
```

## Parameter Decorators

The Management API provides parameter decorators for specific event types:

### extensionInfo

Used with `onExtensionInstalled`, `onExtensionEnabled`, and `onExtensionDisabled` to extract specific properties from the extension info object:

```typescript
import { onExtensionInstalled, extensionInfo, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionDetails {
  @onExtensionInstalled()
  logExtensionDetails(
    @extensionInfo('id') id: string,
    @extensionInfo('name') name: string,
    @extensionInfo('description') description: string,
    @extensionInfo('version') version: string,
    @extensionInfo('type') type: string
  ) {
    console.log(`Extension ID: ${id}`);
    console.log(`Name: ${name}`);
    console.log(`Description: ${description}`);
    console.log(`Version: ${version}`);
    console.log(`Type: ${type}`);
  }
}
```

### extensionId

Used with `onExtensionUninstalled` to extract the extension ID:

```typescript
import { onExtensionUninstalled, extensionId, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionTracker {
  @onExtensionUninstalled()
  trackUninstallation(@extensionId('id') extensionId: string) {
    console.log(`Extension ${extensionId} was uninstalled`);
  }
}
```

## Extension Info Object

The `ExtensionInfo` object typically includes properties such as:

- `id`: The unique identifier of the extension
- `name`: The display name of the extension
- `description`: The description of the extension
- `version`: The version of the extension
- `type`: The type of the extension (e.g., "extension", "theme", "app")
- `enabled`: Whether the extension is enabled
- `homepageUrl`: The URL of the extension's homepage
- `icons`: Array of icon objects
- `installType`: How the extension was installed
- `mayDisable`: Whether the extension can be disabled
- `permissions`: Array of permissions requested by the extension
- `hostPermissions`: Array of host permissions requested by the extension

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a management event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 