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
