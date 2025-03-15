---
sidebar_position: 15
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
  handleCommand(arg: { command: string }) {
    console.log(`Command executed: ${arg.command}`);
    
    switch (arg.command) {
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

With parameter decorator:

```typescript
import { onCommand, commandName, InjectableService } from 'deco-ext';

@InjectableService()
class ShortcutService {
  @onCommand()
  handleCommand(@commandName() command: string) {
    console.log(`Executing command: ${command}`);
    
    if (command === 'capture-screenshot') {
      this.captureScreenshot();
    } else if (command === 'save-page') {
      this.savePage();
    }
  }
  
  private captureScreenshot() {
    // Capture and save a screenshot
  }
  
  private savePage() {
    // Save the current page content
  }
}
```

## Parameter Decorators

### commandName

Used with `onCommand` to directly access the command name:

```typescript
import { onCommand, commandName, InjectableService } from 'deco-ext';

@InjectableService()
class CommandLogger {
  @onCommand()
  logCommand(@commandName() cmd: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] User executed command: ${cmd}`);
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

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered, and then routes events to all decorated methods. When a command is executed:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

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
