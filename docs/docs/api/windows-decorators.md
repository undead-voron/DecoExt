---
title: Windows Decorators
---

# Windows Decorators

The Windows decorators allow you to easily respond to browser window events in your extension services.

## Method Decorators

### onWindowCreated

This decorator handles window creation events. It attaches a listener to `browser.windows.onCreated` events.

```typescript
import { onWindowCreated, InjectableService } from 'deco-ext';

@InjectableService()
class WindowService {
  @onWindowCreated()
  handleWindowCreation(arg: { window: browser.Windows.Window }) {
    console.log('Window created with ID:', arg.window.id);
    console.log('Window type:', arg.window.type);
  }
}
```

The decorated method is called whenever a new browser window is created. By default, the method receives an object with a `window` property containing the browser window information.

### onWindowRemoved

This decorator handles window removal events. It attaches a listener to `browser.windows.onRemoved` events.

```typescript
import { onWindowRemoved, InjectableService } from 'deco-ext';

@InjectableService()
class WindowCleanupService {
  @onWindowRemoved()
  handleWindowRemoval(windowId: number) {
    console.log(`Window with ID ${windowId} was closed`);
  }
}
```

The decorated method is called whenever a browser window is closed. It receives the ID of the closed window directly as a number parameter.

### onWindowFocusChanged

This decorator handles window focus change events. It attaches a listener to `browser.windows.onFocusChanged` events.

```typescript
import { onWindowFocusChanged, InjectableService } from 'deco-ext';

@InjectableService()
class WindowFocusService {
  @onWindowFocusChanged()
  handleFocusChange(windowId: number) {
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      console.log('All windows are blurred');
    } else {
      console.log(`Window with ID ${windowId} is now focused`);
    }
  }
}
```

The decorated method is called whenever the focused window changes. It receives the window ID of the newly focused window as a number. Note that windowId can be `WINDOW_ID_NONE` (-1) when all windows lose focus.

## Filtering Events

All window decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onWindowCreated, onWindowRemoved, InjectableService } from 'deco-ext';

// Module-level tracking (accessible to filters)
const trackedWindows = new Set<number>();

@InjectableService()
class WindowFilterService {
  // Only handle normal browser windows (not popups or devtools)
  @onWindowCreated({ 
    filter: (arg) => arg.window.type === 'normal' 
  })
  handleNormalWindowCreation(arg: { window: browser.Windows.Window }) {
    console.log(`Normal window created: ${arg.window.id}`);
    // Add to module-level tracking
    trackedWindows.add(arg.window.id!);
  }

  // Only handle focused windows
  @onWindowCreated({ 
    filter: (arg) => arg.window.focused
  })
  handleFocusedWindowCreation(arg: { window: browser.Windows.Window }) {
    console.log(`Focused window created: ${arg.window.id}`);
  }

  // Only handle specific window removals (using module-level tracking)
  @onWindowRemoved({ 
    filter: (windowId) => trackedWindows.has(windowId) 
  })
  handleTrackedWindowRemoval(windowId: number) {
    console.log(`Tracked window ${windowId} was removed`);
    // Remove from module-level tracking
    trackedWindows.delete(windowId);
  }
}
```

### Advanced Filtering Examples

```typescript
import { onWindowFocusChanged, InjectableService } from 'deco-ext';

@InjectableService()
class AdvancedWindowService {
  // Filter focus changes to only handle valid window IDs
  @onWindowFocusChanged({ 
    filter: async (windowId) => {
      if (windowId === browser.windows.WINDOW_ID_NONE) return false;
      
      try {
        await browser.windows.get(windowId);
        return true; // Window exists
      } catch {
        return false; // Window doesn't exist
      }
    }
  })
  handleValidWindowFocus(windowId: number) {
    console.log(`Valid window ${windowId} gained focus`);
  }

  // Filter window creation based on size
  @onWindowCreated({ 
    filter: (arg) => {
      const { width = 0, height = 0 } = arg.window;
      return width > 800 && height > 600; // Only large windows
    }
  })
  handleLargeWindowCreation(arg: { window: browser.Windows.Window }) {
    console.log(`Large window created: ${arg.window.width}x${arg.window.height}`);
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onWindowCreated, windowDetails, InjectableService } from 'deco-ext';

@InjectableService()
class WindowTrackingService {
  @onWindowCreated({ 
    filter: (arg) => !arg.window.incognito // Only non-incognito windows
  })
  trackNormalWindow(
    @windowDetails('id') windowId: number,
    @windowDetails('type') windowType: string,
    @windowDetails('state') windowState: string
  ) {
    console.log(`Tracking normal window ${windowId} (${windowType}, ${windowState})`);
  }
}
```

## Parameter Decorators

### windowInfo

This parameter decorator can **only** be used with the `onWindowCreated` method decorator. It extracts specific properties from the window object:

```typescript
import { onWindowCreated, windowInfo, InjectableService } from 'deco-ext';

@InjectableService()
class WindowMonitorService {
  @onWindowCreated()
  logNewWindow(
    @windowInfo('id') id: number,
    @windowInfo('type') type: string,
    @windowInfo('state') state: string
  ) {
    console.log(`New ${type} window (ID: ${id}) created in ${state} state`);
  }
}
```

The `windowInfo` decorator cannot be used with `onWindowRemoved` or `onWindowFocusChanged` as these method decorators receive a simple window ID parameter directly.

## Type Definitions

The decorators use the following types from the `browser.Windows` API:

```typescript
// Window structure from browser.Windows.Window
interface Window {
  id?: number;
  focused: boolean;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  tabs?: browser.Tabs.Tab[];
  incognito: boolean;
  type?: WindowType;
  state?: WindowState;
  alwaysOnTop: boolean;
  sessionId?: string;
}

type WindowType = "normal" | "popup" | "panel" | "app" | "devtools";
type WindowState = "normal" | "minimized" | "maximized" | "fullscreen" | "docked";
```

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a window event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - For `onWindowCreated`, if parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 