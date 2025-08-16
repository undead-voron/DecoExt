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

## Filtering Events

All management decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onExtensionEnabled, onExtensionDisabled, InjectableService } from 'deco-ext';

@InjectableService()
class ManagementFilterService {
  // Only handle changes to specific extensions
  @onExtensionEnabled({ 
    filter: (info) => info.id !== browser.runtime.id // Don't handle our own extension
  })
  handleOtherExtensionEnabled(info: browser.Management.ExtensionInfo) {
    console.log(`Other extension enabled: ${info.name}`);
    this.analyzeCompatibility(info);
  }

  // Only handle user extensions (not system/policy extensions)
  @onExtensionDisabled({ 
    filter: (info) => info.installType === 'normal' 
  })
  handleUserExtensionDisabled(info: browser.Management.ExtensionInfo) {
    console.log(`User extension disabled: ${info.name}`);
    this.updateCompatibilityCheck();
  }

  // Only handle extensions with specific permissions
  @onExtensionInstalled({ 
    filter: (info) => info.permissions?.includes('tabs') || info.permissions?.includes('activeTab')
  })
  handleTabExtensionInstalled(info: browser.Management.ExtensionInfo) {
    console.log(`Extension with tab permissions installed: ${info.name}`);
    this.checkTabConflicts(info);
  }

  private analyzeCompatibility(info: browser.Management.ExtensionInfo) {
    // Analyze compatibility with other extensions
  }

  private updateCompatibilityCheck() {
    // Update compatibility status
  }

  private checkTabConflicts(info: browser.Management.ExtensionInfo) {
    // Check for potential conflicts with tab-related functionality
  }
}
```

### Advanced Filtering Examples

```typescript
import { onExtensionUninstalled, InjectableService } from 'deco-ext';

// Module-level configuration (accessible to filters)
const monitoredExtensions = new Set(['extension-id-1', 'extension-id-2']);
const dangerousPermissions = ['webRequest', 'webRequestBlocking', 'proxy'];

// Helper functions for extension analysis
function isKnownPublisher(info: browser.Management.ExtensionInfo): boolean {
  // Check if the extension is from a known/trusted publisher
  return false; // Example implementation
}

function hasHighRiskPermissions(info: browser.Management.ExtensionInfo): boolean {
  // Check if extension has high-risk permissions
  return info.permissions?.some(perm => dangerousPermissions.includes(perm)) || false;
}

@InjectableService()
class AdvancedManagementService {

  // Filter based on extension categories or types
  @onExtensionEnabled({ 
    filter: async (info) => {
      // Only handle extensions that might affect our functionality
      const hasConflictingPermissions = info.permissions?.some(perm => 
        dangerousPermissions.some(dangerous => perm.includes(dangerous))
      );
      
      return hasConflictingPermissions;
    }
  })
  handlePotentiallyConflictingExtension(info: browser.Management.ExtensionInfo) {
    console.log(`Extension with potentially conflicting permissions enabled: ${info.name}`);
    this.assessSecurityImplications(info);
  }

  // Only handle monitored extensions
  @onExtensionUninstalled({ 
    filter: (info) => monitoredExtensions.has(info.id) 
  })
  handleMonitoredExtensionRemoval(info: browser.Management.ExtensionInfo) {
    console.log(`Monitored extension uninstalled: ${info.name}`);
    this.cleanupMonitoredExtensionData(info.id);
    monitoredExtensions.delete(info.id);
  }

  // Filter based on extension metadata
  @onExtensionInstalled({ 
    filter: (info) => {
      // Only handle extensions from unknown publishers
      const isFromKnownPublisher = isKnownPublisher(info);
      const hasHighRisk = hasHighRiskPermissions(info);
      
      return !isFromKnownPublisher && hasHighRisk;
    }
  })
  handleSuspiciousExtensionInstallation(info: browser.Management.ExtensionInfo) {
    console.log(`Potentially suspicious extension installed: ${info.name}`);
    this.flagForSecurityReview(info);
  }

  private assessSecurityImplications(info: browser.Management.ExtensionInfo) {
    // Assess security implications of the new extension
  }

  private cleanupMonitoredExtensionData(extensionId: string) {
    // Clean up data related to the monitored extension
  }



  private flagForSecurityReview(info: browser.Management.ExtensionInfo) {
    // Flag extension for manual security review
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onExtensionEnabled, extensionInfo, InjectableService } from 'deco-ext';

@InjectableService()
class ExtensionTrackingService {
  @onExtensionEnabled({ 
    filter: (info) => info.type === 'extension' && info.enabled === true
  })
  trackActiveExtensions(
    @extensionInfo('id') extensionId: string,
    @extensionInfo('name') name: string,
    @extensionInfo('version') version: string
  ) {
    console.log(`Active extension tracked: ${name} v${version} (${extensionId})`);
    this.updateExtensionRegistry(extensionId, name, version);
  }

  private updateExtensionRegistry(id: string, name: string, version: string) {
    // Update internal registry of active extensions
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