---
title: Sessions Decorators
---

# Sessions Decorators

The Sessions decorators allow you to easily respond to browser session events in your extension services.

## Method Decorators

### onSessionChanged

This decorator handles events that fire when recently closed tabs and/or windows are changed. This can happen when tabs or windows are closed or restored from the browser's session history.

```typescript
import { onSessionChanged, InjectableService } from 'deco-ext';

@InjectableService()
class SessionService {
  @onSessionChanged()
  handleSessionChange() {
    // This event doesn't provide any arguments
    console.log('Session changed - recently closed tabs/windows were modified');
    
    // You might want to fetch the current session data:
    this.getRecentlyClosedItems();
  }
  
  private async getRecentlyClosedItems() {
    const sessions = await browser.sessions.getRecentlyClosed();
    console.log('Recent sessions:', sessions);
  }
}
```

## Parameter Decorators

No parameter decorators are available for the `onSessionChanged` decorator since the browser event doesn't provide any arguments.

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered, and then routes events to all decorated methods. When a session change event occurs:

1. The event is received by the single registered browser API listener
2. Each registered method handler is called
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - The method is called with no parameters

The decorator can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.

## Working with Sessions

While the onSessionChanged event itself doesn't provide arguments, you can use the browser.sessions API to:

- Retrieve recently closed tabs and windows with `browser.sessions.getRecentlyClosed()`
- Restore closed tabs with `browser.sessions.restore(sessionId)`
- Get device information with `browser.sessions.getDevices()`

Example of restoring the most recently closed tab:

```typescript
import { onSessionChanged, InjectableService } from 'deco-ext';

@InjectableService()
class SessionService {
  @onSessionChanged()
  async handleSessionChange() {
    // Get recently closed sessions
    const sessions = await browser.sessions.getRecentlyClosed();
    
    // Find the most recently closed tab
    const recentTab = sessions.find(session => session.tab);
    
    if (recentTab && recentTab.tab) {
      console.log(`Most recently closed tab: ${recentTab.tab.title}`);
      
      // You could potentially auto-restore it
      // await browser.sessions.restore(recentTab.tab.sessionId);
    }
  }
}
```
