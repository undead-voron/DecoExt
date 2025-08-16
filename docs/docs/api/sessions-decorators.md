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

## Filtering Events

All session decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onSessionChanged, InjectableService } from 'deco-ext';

@InjectableService()
class SessionFilterService {
  // Only handle session changes for specific devices
  @onSessionChanged({ 
    filter: (session) => session.device && session.device.info.includes('desktop') 
  })
  handleDesktopSessions(session: browser.Sessions.Session) {
    console.log(`Desktop session changed: ${session.device?.deviceName}`);
    this.syncDesktopSettings(session);
  }

  // Only handle sessions with recent activity
  @onSessionChanged({ 
    filter: (session) => {
      const lastModified = session.lastModified;
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return lastModified > oneHourAgo;
    }
  })
  handleRecentSessions(session: browser.Sessions.Session) {
    console.log(`Recent session activity: ${session.device?.deviceName}`);
    this.trackRecentActivity(session);
  }

  // Only handle sessions with multiple windows
  @onSessionChanged({ 
    filter: (session) => session.windows && session.windows.length > 1 
  })
  handleMultiWindowSessions(session: browser.Sessions.Session) {
    console.log(`Multi-window session: ${session.windows?.length} windows`);
    this.optimizeWindowLayout(session);
  }

  private syncDesktopSettings(session: browser.Sessions.Session) {
    // Sync settings for desktop sessions
  }

  private trackRecentActivity(session: browser.Sessions.Session) {
    // Track recent session activity
  }

  private optimizeWindowLayout(session: browser.Sessions.Session) {
    // Optimize layout for multi-window sessions
  }
}
```

### Advanced Filtering Examples

```typescript
import { onSessionChanged, InjectableService } from 'deco-ext';

// Module-level configuration (accessible to filters)
const monitoredDevices = new Set(['work-laptop', 'home-desktop']);
const importantUrls = ['github.com', 'stackoverflow.com', 'docs.google.com'];

// Helper function for device trust verification
async function isDeviceTrusted(device: browser.Sessions.Device): Promise<boolean> {
  // Check if device is in trusted device list
  return true; // Example implementation
}

@InjectableService()
class AdvancedSessionService {

  // Filter sessions from specific devices
  @onSessionChanged({ 
    filter: (session) => {
      const deviceName = session.device?.deviceName || '';
      return monitoredDevices.has(deviceName);
    }
  })
  handleMonitoredDeviceSessions(session: browser.Sessions.Session) {
    console.log(`Monitored device session: ${session.device?.deviceName}`);
    this.syncCriticalData(session);
  }

  // Filter based on session content
  @onSessionChanged({ 
    filter: (session) => {
      if (!session.windows) return false;
      
      // Check if session contains any important URLs
      return session.windows.some(window => 
        window.tabs?.some(tab => 
          importantUrls.some(url => tab.url?.includes(url))
        )
      );
    }
  })
  handleImportantContentSessions(session: browser.Sessions.Session) {
    console.log('Session with important content detected');
    this.prioritizeSession(session);
  }

  // Filter based on session metadata
  @onSessionChanged({ 
    filter: async (session) => {
      if (!session.device) return false;
      
      // Only handle sessions from trusted devices
      const isTrusted = await isDeviceTrusted(session.device);
      return isTrusted;
    }
  })
  handleTrustedDeviceSessions(session: browser.Sessions.Session) {
    console.log(`Trusted device session: ${session.device?.deviceName}`);
    this.enableSensitiveDataSync(session);
  }

  private syncCriticalData(session: browser.Sessions.Session) {
    // Sync critical data from monitored devices
  }

  private prioritizeSession(session: browser.Sessions.Session) {
    // Prioritize sessions with important content
  }

  private enableSensitiveDataSync(session: browser.Sessions.Session) {
    // Enable syncing of sensitive data for trusted devices
  }
}
```

### Filter with Parameter Decorators

```typescript
import { onSessionChanged, sessionData, InjectableService } from 'deco-ext';

@InjectableService()
class SessionTrackingService {
  @onSessionChanged({ 
    filter: (session) => session.device?.info.includes('mobile')
  })
  trackMobileSessions(
    @sessionData('device') device: browser.Sessions.Device | undefined,
    @sessionData('lastModified') lastModified: number
  ) {
    if (device) {
      console.log(`Mobile session from ${device.deviceName} at ${new Date(lastModified)}`);
      this.optimizeForMobile(device);
    }
  }

  private optimizeForMobile(device: browser.Sessions.Device) {
    // Optimize settings for mobile sessions
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
