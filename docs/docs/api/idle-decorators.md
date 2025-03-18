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