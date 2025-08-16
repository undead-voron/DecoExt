---
title: Commands Decorators
---

# Commands Decorators

The Commands decorator allows you to easily respond to keyboard shortcut commands in your extension services. This decorator provides a clean way to handle keyboard shortcuts that are registered in your extension.

## Method Decorators

### onCommand

This decorator handles events that fire when a registered keyboard command is pressed.

```typescript
import { onCommand, InjectableService } from 'deco-ext';

@InjectableService()
class ShortcutService {
  @onCommand()
  handleCommand(command: string) {
    console.log(`Command executed: ${command}`);
    
    switch (command) {
      case 'toggle-feature':
        this.toggleFeature();
        break;
      case 'open-popup':
        this.openPopup();
        break;
      case 'refresh-data':
        this.refreshData();
        break;
    }
  }
  
  private toggleFeature() {
    // Toggle a feature on/off
  }
  
  private openPopup() {
    // Open the extension popup
  }
  
  private refreshData() {
    // Refresh application data
  }
}
```

## Registering Commands

Commands must be registered in your extension's manifest.json file:

```json
{
  "commands": {
    "toggle-feature": {
      "suggested_key": {
        "default": "Ctrl+Shift+F",
        "mac": "Command+Shift+F"
      },
      "description": "Toggle feature"
    },
    "open-popup": {
      "suggested_key": {
        "default": "Ctrl+Shift+P",
        "mac": "Command+Shift+P"
      },
      "description": "Open extension popup"
    },
    "_execute_browser_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y",
        "mac": "Command+Shift+Y"
      }
    }
  }
}
```

The special command `_execute_browser_action` is used to open the extension's popup.

## Filtering Events

The `onCommand` decorator supports an optional `filter` parameter that allows you to conditionally handle command events. The filter function receives the command string and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onCommand, InjectableService } from 'deco-ext';

@InjectableService()
class CommandFilterService {
  // Only handle feature-related commands
  @onCommand({ 
    filter: (command) => command.startsWith('feature-') 
  })
  handleFeatureCommands(command: string) {
    console.log(`Feature command executed: ${command}`);
    
    switch (command) {
      case 'feature-toggle':
        this.toggleFeature();
        break;
      case 'feature-reset':
        this.resetFeature();
        break;
    }
  }

  // Only handle debug commands in development mode
  @onCommand({ 
    filter: (command) => command.startsWith('debug-') && process.env.NODE_ENV === 'development' 
  })
  handleDebugCommands(command: string) {
    console.log(`Debug command executed: ${command}`);
  }

  private toggleFeature() {
    // Toggle feature logic
  }

  private resetFeature() {
    // Reset feature logic
  }
}
```

### Advanced Filtering Examples

```typescript
import { onCommand, InjectableService } from 'deco-ext';

// Module-level configuration (accessible to filters)
const userPermissions = ['read', 'write']; // Example user permissions
const commandPermissions: { [key: string]: string[] } = {
  'delete-data': ['admin'],
  'modify-settings': ['write'],
  'view-logs': ['read']
};

// Helper function for authentication check
function isUserAuthenticated(): boolean {
  // Check if user is authenticated
  return true; // Example implementation
}
@InjectableService()
class AdvancedCommandService {
  // Filter commands based on user permissions (using module-level data)
  @onCommand({ 
    filter: async (command) => {
      const requiredPermissions = commandPermissions[command] || [];
      return requiredPermissions.every(perm => userPermissions.includes(perm));
    }
  })
  handlePrivilegedCommands(command: string) {
    console.log(`Privileged command executed: ${command}`);
  }

  // Filter commands based on application state (using module-level function)
  @onCommand({ 
    filter: (command) => {
      // Only allow certain commands when user is authenticated
      const authCommands = ['logout', 'profile', 'settings'];
      return authCommands.includes(command) ? isUserAuthenticated() : true;
    }
  })
  handleAuthenticatedCommands(command: string) {
    console.log(`Authenticated command executed: ${command}`);
  }
}
```

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered, and then routes events to all decorated methods. When a command is executed:

1. The event is received by the single registered browser API listener
2. The command string is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - The method is called with the command string as the parameter

The decorator can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.

## Dynamically Working with Commands

You can also work with commands programmatically using the browser.commands API:

```typescript
// Get all commands
const commands = await browser.commands.getAll();
console.log('Available commands:', commands);

// Reset a specific command's shortcut
await browser.commands.reset('toggle-feature');
```
