---
title: Idle Decorators
---

# Idle Decorators

The Idle decorators allow you to easily respond to changes in the system's idle state in your extension service. These decorators provide a clean way to track when the system becomes active, idle, or locked.

## Method Decorators

### onIdleStateChanged

This decorator handles events that fire when the system changes to an active, idle or locked state.

```typescript
import { onIdleStateChanged, InjectableService } from 'deco-ext';

@InjectableService()
class IdleMonitor {
  @onIdleStateChanged()
  handleStateChange(newState: browser.Idle.IdleState) {
    console.log(`System state changed to: ${newState}`);
    
    // newState will be one of: "active", "idle", or "locked"
    if (newState === "idle") {
      console.log("User is away");
    } else if (newState === "active") {
      console.log("User has returned");
    } else if (newState === "locked") {
      console.log("Device is locked");
    }
  }
}
```

## Idle States

The Chrome idle API reports three possible states:

- `active`: The user is actively using the device
- `idle`: The device has not received user input for the specified idle detection interval
- `locked`: The screen is locked or the screensaver is active

## Filtering Events

The `onIdleStateChanged` decorator supports an optional `filter` parameter that allows you to conditionally handle idle state changes. The filter function receives the new state and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onIdleStateChanged, InjectableService } from 'deco-ext';

@InjectableService()
class IdleFilterService {
  // Only handle transitions to active state
  @onIdleStateChanged({ 
    filter: (newState) => newState === 'active' 
  })
  handleUserReturn(newState: browser.Idle.IdleState) {
    console.log('User has returned to active state');
    this.resumeActivity();
  }

  // Only handle idle and locked states (not active)
  @onIdleStateChanged({ 
    filter: (newState) => newState === 'idle' || newState === 'locked' 
  })
  handleUserAway(newState: browser.Idle.IdleState) {
    console.log(`User is away (${newState})`);
    this.pauseActivity();
  }

  private resumeActivity() {
    // Resume background tasks or notifications
  }

  private pauseActivity() {
    // Pause CPU-intensive operations
  }
}
```

### Advanced Filtering Examples

```typescript
import { onIdleStateChanged, InjectableService } from 'deco-ext';

// Module-level state tracking (accessible to filters)
let lastState: browser.Idle.IdleState = 'active';
const workingHours = { start: 9, end: 17 };

// Helper function for checking sensitive data
async function checkForSensitiveData(): Promise<boolean> {
  // Check if any tabs have sensitive data
  return true; // Example implementation
}

@InjectableService()
class AdvancedIdleService {

  // Only handle state changes during working hours
  @onIdleStateChanged({ 
    filter: (newState) => {
      const hour = new Date().getHours();
      return hour >= workingHours.start && hour <= workingHours.end;
    }
  })
  handleWorkHourStateChanges(newState: browser.Idle.IdleState) {
    console.log(`Work hours state change: ${lastState} -> ${newState}`);
    this.trackProductivity(newState);
    lastState = newState;
  }

  // Filter specific state transitions
  @onIdleStateChanged({ 
    filter: (newState) => {
      // Only handle transitions from active to idle (not locked)
      return lastState === 'active' && newState === 'idle';
    }
  })
  handleActiveToIdleTransition(newState: browser.Idle.IdleState) {
    console.log('User just became idle after being active');
    this.startIdleTimer();
  }

  // Filter with async operations
  @onIdleStateChanged({ 
    filter: async (newState) => {
      if (newState !== 'locked') return false;
      
      // Only handle screen lock if user has sensitive data open
      const hasSensitiveData = await checkForSensitiveData();
      return hasSensitiveData;
    }
  })
  handleSensitiveDataScreenLock(newState: browser.Idle.IdleState) {
    console.log('Screen locked with sensitive data present - securing data');
    this.secureSensitiveData();
  }

  private trackProductivity(state: browser.Idle.IdleState) {
    // Track user productivity based on idle states
  }

  private startIdleTimer() {
    // Start timer for idle activities
  }



  private secureSensitiveData() {
    // Hide or encrypt sensitive information
  }
}
```

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered for the idle state change event, and then routes events to all decorated methods. When the idle state changes:

1. The event is received by the single registered browser API listener
2. The event data (`newState`) is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - The method is called with the new idle state as a parameter

The decorator can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.

## Use Cases

The idle API is particularly useful for:

- Pausing CPU-intensive operations when the user is away
- Securing sensitive data when the user is inactive
- Tracking user activity for analytics purposes
- Implementing auto-save features
- Showing different content based on user activity state 