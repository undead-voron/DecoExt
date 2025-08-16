---
title: Alarms Decorators
---

# Alarms Decorators

The Alarms decorators allow you to easily respond to alarm events in your extension service. These decorators provide a clean way to handle scheduled operations in your browser extension.

## Method Decorators

### onAlarmFired

This decorator handles events that fire when an alarm has elapsed. It can be configured to respond to all alarms or only alarms with a specific name.

#### Responding to all alarms

```typescript
import { InjectableService, onAlarmFired } from 'deco-ext'

@InjectableService()
class AlarmHandler {
  @onAlarmFired()
  handleAlarm(alarm: browser.Alarms.Alarm) {
    console.log(`Alarm fired: ${alarm.name}`)

    if (alarm.name === 'dailySync') {
      this.performDailySync()
    }
    else if (alarm.name === 'reminder') {
      this.showReminder()
    }
  }

  private performDailySync() {
    // Sync data with server
  }

  private showReminder() {
    // Show a notification to the user
  }
}
```

#### Responding to a specific named alarm

```typescript
import { InjectableService, onAlarmFired } from 'deco-ext'

@InjectableService()
class AlarmHandler {
  @onAlarmFired({ name: 'dailySync' })
  handleDailySync(alarm: browser.Alarms.Alarm) {
    console.log('Running daily sync operation')
    // Sync data with server
  }

  @onAlarmFired({ name: 'reminder' })
  handleReminder(alarm: browser.Alarms.Alarm) {
    console.log('Showing reminder notification')
    // Show a notification to the user
  }
}
```

#### With parameter decorator:

```typescript
import { alarmDetails, InjectableService, onAlarmFired } from 'deco-ext'

@InjectableService()
class AlarmHandler {
  @onAlarmFired()
  handleAlarm(
    @alarmDetails('name') alarmName: string,
    @alarmDetails('scheduledTime') scheduledTime: number
  ) {
    console.log(`Alarm "${alarmName}" fired`)
    console.log(`Scheduled time: ${new Date(scheduledTime).toLocaleString()}`)

    if (alarmName === 'dailySync') {
      this.performDailySync()
    }
  }

  private performDailySync() {
    // Sync data with server
  }
}
```

## Filtering Events

The `onAlarmFired` decorator supports an optional `filter` parameter that allows you to conditionally handle alarm events. The filter function receives the alarm object and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onAlarmFired, InjectableService } from 'deco-ext';

@InjectableService()
class AlarmFilterService {
  // Only handle recurring alarms
  @onAlarmFired({ 
    filter: (alarm) => !!alarm.periodInMinutes 
  })
  handleRecurringAlarms(alarm: browser.Alarms.Alarm) {
    console.log(`Recurring alarm fired: ${alarm.name} (every ${alarm.periodInMinutes} minutes)`);
  }

  // Only handle one-time alarms
  @onAlarmFired({ 
    filter: (alarm) => !alarm.periodInMinutes 
  })
  handleOneTimeAlarms(alarm: browser.Alarms.Alarm) {
    console.log(`One-time alarm completed: ${alarm.name}`);
  }
}
```

### Advanced Filtering Examples

```typescript
import { onAlarmFired, InjectableService } from 'deco-ext';

@InjectableService()
class AlarmFilterService {
  // Filter alarms based on time of day
  @onAlarmFired({ 
    filter: (alarm) => {
      const hour = new Date(alarm.scheduledTime).getHours();
      return hour >= 9 && hour <= 17; // Only handle during business hours
    }
  })
  handleBusinessHourAlarms(alarm: browser.Alarms.Alarm) {
    console.log(`Business hour alarm: ${alarm.name}`);
  }

  // Combine named alarms with filtering
  @onAlarmFired({ 
    name: 'sync',
    filter: async (alarm) => {
      // You can use async logic in filters
      const isOnline = await checkNetworkStatus();
      return isOnline; // Only sync when online
    }
  })
  handleSyncAlarm(alarm: browser.Alarms.Alarm) {
    console.log('Performing sync operation while online');
  }

  // Filter based on alarm execution frequency
  @onAlarmFired({ 
    filter: (alarm) => {
      if (!alarm.periodInMinutes) return true; // Always handle one-time alarms
      
      // Only handle frequent recurring alarms (less than 1 hour interval)
      return alarm.periodInMinutes < 60;
    }
  })
  handleFrequentAlarms(alarm: browser.Alarms.Alarm) {
    console.log(`Frequent alarm triggered: ${alarm.name}`);
  }
}

// Helper function for the async filter example above
async function checkNetworkStatus(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/generate_204', { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    return true;
  } catch {
    return false;
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onAlarmFired, alarmDetails, InjectableService } from 'deco-ext';

@InjectableService()
class AlarmFilterService {
  @onAlarmFired({ 
    filter: (alarm) => alarm.name.startsWith('task_') // Only task-related alarms
  })
  handleTaskAlarms(
    @alarmDetails('name') alarmName: string,
    @alarmDetails('scheduledTime') scheduledTime: number
  ) {
    console.log(`Task alarm executed: ${alarmName}`);
    console.log(`Originally scheduled for: ${new Date(scheduledTime).toLocaleString()}`);
  }
}

```

## Parameter Decorators

### alarmDetails

Used with `onAlarmFired` to extract specific properties from the alarm object:

```typescript
import { alarmDetails, InjectableService, onAlarmFired } from 'deco-ext'

@InjectableService()
class AlarmProcessor {
  @onAlarmFired()
  processAlarm(
    @alarmDetails('name') name: string,
    @alarmDetails('scheduledTime') scheduledTime: number,
    @alarmDetails('periodInMinutes') periodInMinutes?: number
  ) {
    console.log(`Alarm name: ${name}`)
    console.log(`Scheduled time: ${new Date(scheduledTime).toLocaleString()}`)

    if (periodInMinutes) {
      console.log(`Recurring alarm every ${periodInMinutes} minutes`)
    }
    else {
      console.log('One-time alarm')
    }
  }
}
```

## Alarm Object

The `Alarm` object typically includes the following properties:

- `name`: The name of the alarm
- `scheduledTime`: The time when the alarm is scheduled to fire, in milliseconds since the epoch
- `periodInMinutes`: (Optional) If present, the alarm will repeatedly fire with the specified period

## Creating Alarms

While the decorator handles the event subscription, you'll need to create alarms separately using the Chrome Alarms API:

```typescript
import browser from 'webextension-polyfill'

// Create a one-time alarm that fires in 5 minutes
browser.alarms.create('reminder', { delayInMinutes: 5 })

// Create a recurring alarm that fires every 30 minutes
browser.alarms.create('sync', { periodInMinutes: 30 })

// Create an alarm that fires at a specific time
const timestamp = Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
browser.alarms.create('dailyTask', { when: timestamp })
```

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered for the alarm event, and then routes events to all decorated methods. When an alarm fires:

1. The event is received by the single registered browser API listener
2. If the alarm has a specific name that matches a named listener, only that handler is called
3. All general (unnamed) handlers are called for every alarm
4. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the alarm data is transformed accordingly
   - The method is called with the appropriate parameters

The decorator can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.
