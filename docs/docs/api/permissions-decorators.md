---
title: Permissions Decorators
---

# Permissions Decorators

The Permissions decorators allow you to easily respond to browser permission events in your extension services. These decorators provide a clean way to handle permission changes, including when permissions are added or removed.

## Method Decorators

### onPermissionsAdded

This decorator handles events that fire when the extension receives new permissions.

```typescript
import { onPermissionsAdded, InjectableService } from 'deco-ext';

@InjectableService()
class PermissionService {
  @onPermissionsAdded()
  handleNewPermissions(permissions: browser.Permissions.Permissions) {
    console.log('New permissions added:');
    
    if (permissions.origins && permissions.origins.length > 0) {
      console.log('Origins:', permissions.origins);
    }
    
    if (permissions.permissions && permissions.permissions.length > 0) {
      console.log('Permissions:', permissions.permissions);
    }
  }
}
```

With parameter decorator:

```typescript
import { onPermissionsAdded, permissionDetails, InjectableService } from 'deco-ext';

@InjectableService()
class PermissionService {
  @onPermissionsAdded()
  handleNewPermissions(
    @permissionDetails('origins') origins: string[],
    @permissionDetails('permissions') permissions: string[]
  ) {
    if (origins && origins.length > 0) {
      console.log('New origin permissions:', origins.join(', '));
    }
    
    if (permissions && permissions.length > 0) {
      console.log('New API permissions:', permissions.join(', '));
    }
  }
}
```

### onPermissionsRemoved

This decorator handles events that fire when the extension loses permissions.

```typescript
import { onPermissionsRemoved, InjectableService } from 'deco-ext';

@InjectableService()
class PermissionService {
  @onPermissionsRemoved()
  handleRemovedPermissions(permissions: browser.Permissions.Permissions) {
    console.log('Permissions removed:');
    
    if (permissions.origins && permissions.origins.length > 0) {
      console.log('Origins:', permissions.origins);
      this.disableFeaturesDependingOnOrigins(permissions.origins);
    }
    
    if (permissions.permissions && permissions.permissions.length > 0) {
      console.log('Permissions:', permissions.permissions);
      this.disableFeaturesDependingOnPermissions(permissions.permissions);
    }
  }
  
  private disableFeaturesDependingOnOrigins(origins: string[]) {
    // Disable features that depend on these origins
  }
  
  private disableFeaturesDependingOnPermissions(permissions: string[]) {
    // Disable features that depend on these permissions
  }
}
```

With parameter decorator:

```typescript
import { onPermissionsRemoved, permissionDetails, InjectableService } from 'deco-ext';

@InjectableService()
class PermissionService {
  @onPermissionsRemoved()
  handleRemovedPermissions(
    @permissionDetails('origins') origins: string[],
    @permissionDetails('permissions') permissions: string[]
  ) {
    if (origins && origins.length > 0) {
      console.log('Lost origin permissions:', origins.join(', '));
      this.updateUIForRemovedOrigins(origins);
    }
    
    if (permissions && permissions.length > 0) {
      console.log('Lost API permissions:', permissions.join(', '));
      this.updateUIForRemovedPermissions(permissions);
    }
  }
  
  private updateUIForRemovedOrigins(origins: string[]) {
    // Update UI to reflect lost origin permissions
  }
  
  private updateUIForRemovedPermissions(permissions: string[]) {
    // Update UI to reflect lost API permissions
  }
}
```

## Filtering Events

All permission decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onPermissionsAdded, onPermissionsRemoved, InjectableService } from 'deco-ext';

@InjectableService()
class PermissionFilterService {
  // Only handle specific permission additions
  @onPermissionsAdded({ 
    filter: (permissions) => permissions.permissions?.includes('storage') || permissions.permissions?.includes('tabs')
  })
  handleImportantPermissions(permissions: browser.Permissions.Permissions) {
    console.log('Important permissions added:', permissions.permissions);
    this.enableAdvancedFeatures();
  }

  // Only handle host permission changes
  @onPermissionsAdded({ 
    filter: (permissions) => permissions.origins && permissions.origins.length > 0 
  })
  handleHostPermissions(permissions: browser.Permissions.Permissions) {
    console.log('New host permissions:', permissions.origins);
    this.updateContentScriptRegistration();
  }

  // Filter permission removals
  @onPermissionsRemoved({ 
    filter: (permissions) => permissions.permissions?.includes('notifications') 
  })
  handleNotificationPermissionRemoval(permissions: browser.Permissions.Permissions) {
    console.log('Notification permission removed - disabling notifications');
    this.disableNotificationFeatures();
  }

  private enableAdvancedFeatures() {
    // Enable features that require these permissions
  }

  private updateContentScriptRegistration() {
    // Update content script registration for new origins
  }

  private disableNotificationFeatures() {
    // Disable notification-related features
  }
}
```

### Advanced Filtering Examples

```typescript
import { onPermissionsRemoved, InjectableService } from 'deco-ext';

// Module-level configuration (accessible to filters)
const criticalPermissions = ['storage', 'tabs', 'activeTab'];

// Helper functions for permission management
function isInitialSetup(): boolean {
  // Check if this is during initial extension setup
  return false; // Example implementation
}

function isUserManagingPermissions(): boolean {
  // Check if user is actively in permissions management UI
  return false; // Example implementation
}

@InjectableService()
class AdvancedPermissionService {

  // Only handle removal of critical permissions
  @onPermissionsRemoved({ 
    filter: async (permissions) => {
      if (!permissions.permissions) return false;
      
      // Check if any critical permissions are being removed
      return permissions.permissions.some(perm => 
        criticalPermissions.includes(perm)
      );
    }
  })
  handleCriticalPermissionRemoval(permissions: browser.Permissions.Permissions) {
    console.log('Critical permissions removed:', permissions.permissions);
    this.gracefullyDisableFeatures(permissions.permissions || []);
  }

  // Filter based on user context
  @onPermissionsAdded({ 
    filter: (permissions) => {
      // Only handle during initial setup or when user is actively managing permissions
      const isSetup = isInitialSetup();
      const isUserAction = isUserManagingPermissions();
      
      return isSetup || isUserAction;
    }
  })
  handleUserRequestedPermissions(permissions: browser.Permissions.Permissions) {
    console.log('User-requested permissions added:', permissions);
    this.showPermissionConfirmation(permissions);
  }

  private gracefullyDisableFeatures(removedPermissions: string[]) {
    // Gracefully disable features that depend on removed permissions
  }



  private showPermissionConfirmation(permissions: browser.Permissions.Permissions) {
    // Show confirmation to user about new permissions
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onPermissionsAdded, permissionDetails, InjectableService } from 'deco-ext';

@InjectableService()
class PermissionTrackingService {
  @onPermissionsAdded({ 
    filter: (permissions) => permissions.origins !== undefined // Only host permission additions
  })
  trackHostPermissions(
    @permissionDetails('origins') origins: string[] | undefined
  ) {
    if (origins) {
      console.log('New host permissions granted:', origins);
      origins.forEach(origin => this.analyzeOrigin(origin));
    }
  }

  private analyzeOrigin(origin: string) {
    // Analyze the new origin for security or functionality purposes
  }
}
```

## Parameter Decorators

### permissionDetails

This parameter decorator can be used with both `onPermissionsAdded` and `onPermissionsRemoved` to extract specific properties from the permissions object:

```typescript
import { onPermissionsAdded, permissionDetails, InjectableService } from 'deco-ext';

@InjectableService()
class PermissionTracker {
  @onPermissionsAdded()
  trackPermissionChanges(
    @permissionDetails('origins') origins: string[],
    @permissionDetails('permissions') permissions: string[]
  ) {
    // Access specific properties from the permissions object
    console.log(`Added origins: ${origins?.join(', ') || 'none'}`);
    console.log(`Added permissions: ${permissions?.join(', ') || 'none'}`);
  }
}
```

## Permissions Object Structure

The permissions object contains two main properties:

- `origins`: An array of host permissions (URL patterns)
- `permissions`: An array of API permissions (like "tabs", "storage", etc.)

Example:

```typescript
{
  origins: ["*://example.com/*"],
  permissions: ["tabs", "storage"]
}
```

## Working with Permissions

In addition to responding to permission changes, you can use the browser.permissions API to:

- Check if permissions exist with `browser.permissions.contains()`
- Request new permissions with `browser.permissions.request()`
- Remove permissions with `browser.permissions.remove()`
- Get all current permissions with `browser.permissions.getAll()`

Example of checking and requesting permissions:

```typescript
import { InjectableService } from 'deco-ext';

@InjectableService()
class PermissionManager {
  async ensureTabsPermission() {
    const hasPermission = await browser.permissions.contains({
      permissions: ['tabs']
    });
    
    if (!hasPermission) {
      const granted = await browser.permissions.request({
        permissions: ['tabs']
      });
      
      if (granted) {
        console.log('Tabs permission granted');
        return true;
      } else {
        console.log('Tabs permission denied');
        return false;
      }
    }
    
    return true;
  }
}
```

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a permission event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 