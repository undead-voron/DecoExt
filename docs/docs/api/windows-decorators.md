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