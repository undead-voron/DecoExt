---
sidebar_position: 12
title: Idle Decorators
---

# Idle Decorators

The Idle decorator allows you to easily respond to browser idle state changes in your extension service. This decorator provides a clean way to detect when the user becomes inactive or returns to the browser.

## Method Decorators

### onIdleStateChanged

This decorator handles events that fire when the system's idle state changes.

```typescript
import { onIdleStateChanged, InjectableService } from 'deco-ext';

@InjectableService()
class IdleMonitor {
  @onIdleStateChanged()
  handleIdleStateChange(arg: { newState: browser.Idle.IdleState }) {
    const state = arg.newState;
    
    if (state === 'idle') {
      console.log('User has gone idle');
      this.pauseActiveOperations();
    } 
    else if (state === 'active') {
      console.log('User is active again');
      this.resumeOperations();
    }
    else if (state === 'locked') {
      console.log('Screen is locked');
      this.secureUserData();
    }
  }
  
  private pauseActiveOperations() {
    // Pause operations that require user attention
  }
  
  private resumeOperations() {
    // Resume operations when user returns
  }
  
  private secureUserData() {
    // Take security measures when screen is locked
  }
}
```

With parameter decorator:

```typescript
import { onIdleStateChanged, newState, InjectableService } from 'deco-ext';

@InjectableService()
class IdleMonitor {
  @onIdleStateChanged()
  handleStateChange(@newState() state: browser.Idle.IdleState) {
    switch (state) {
      case 'active':
        console.log('User is active');
        this.startActivityTracking();
        break;
      case 'idle':
        console.log('User is idle');
        this.pauseActivityTracking();
        break;
      case 'locked':
        console.log('Screen is locked');
        this.stopActivityTracking();
        break;
    }
  }
  
  private startActivityTracking() {
    // Start tracking user activity
  }
  
  private pauseActivityTracking() {
    // Pause tracking when user is idle
  }
  
  private stopActivityTracking() {
    // Stop tracking when screen is locked
  }
}
```

## Parameter Decorators

### newState

Used with `onIdleStateChanged` to directly access the idle state:

```typescript
import { onIdleStateChanged, newState, InjectableService } from 'deco-ext';

@InjectableService()
class IdleStateLogger {
  @onIdleStateChanged()
  logStateChanges(@newState() state: browser.Idle.IdleState) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Idle state changed to: ${state}`);
  }
}
```

## Idle States

The possible idle states are:

- `'active'`: The user is actively using the computer
- `'idle'`: The user has not interacted with the computer for a specified period
- `'locked'`: The screen is locked (or the screensaver is active on some platforms)

## Setting Up Idle Detection

Before using the idle API, you must set the detection interval. This is typically done in your background script:

```typescript
// Set idle detection to trigger after 60 seconds of inactivity
browser.idle.setDetectionInterval(60);
```

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered, and then routes events to all decorated methods. When an idle state change occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorator can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.

## Use Cases

The idle API is particularly useful for:

- Pausing CPU-intensive operations when the user is away
- Securing sensitive data when the user is inactive
- Tracking user activity for analytics purposes
- Implementing auto-save features
- Showing different content based on user activity state 