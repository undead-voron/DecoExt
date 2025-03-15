---
sidebar_position: 13
title: Alarms Decorators
---

# Alarms Decorators

The Alarms decorator allows you to easily respond to alarm events in your extension services. This decorator provides a clean way to handle scheduled tasks in your extension.

## Method Decorators

### onAlarmFired

This decorator handles events that fire when an alarm has elapsed.

```typescript
import { onAlarmFired, InjectableService } from 'deco-ext';

@InjectableService()
class ScheduledTaskService {
  @onAlarmFired()
  handleAlarm(arg: { alarm: browser.Alarms.Alarm }) {
    console.log('Alarm fired:', arg.alarm.name);
    console.log('Scheduled time:', new Date(arg.alarm.scheduledTime));
    
    if (arg.alarm.name === 'dailySync') {
      this.performDailySync();
    } else if (arg.alarm.name === 'hourlyCheck') {
      this.performHourlyCheck();
    }
  }
  
  private performDailySync() {
    // Perform daily synchronization task
  }
  
  private performHourlyCheck() {
    // Perform hourly check task
  }
}
```

With parameter decorator:

```typescript
import { onAlarmFired, alarm, InjectableService } from 'deco-ext';

@InjectableService()
class ScheduledTaskService {
  @onAlarmFired()
  handleAlarm(@alarm('name') alarmName: string) {
    console.log(`Alarm "${alarmName}" fired`);
    
    switch (alarmName) {
      case 'refreshData':
        this.refreshData();
        break;
      case 'cleanupCache':
        this.cleanupCache();
        break;
    }
  }
  
  private refreshData() {
    // Refresh application data
  }
  
  private cleanupCache() {
    // Clean up cached data
  }
}
```

## Parameter Decorators

### alarm

Used with `onAlarmFired` to extract specific properties from the Alarm object:

```typescript
import { onAlarmFired, alarm, InjectableService } from 'deco-ext';

@InjectableService()
class AlarmLogger {
  @onAlarmFired()
  logAlarmDetails(
    @alarm('name') name: string,
    @alarm('scheduledTime') scheduledTime: number,
    @alarm('periodInMinutes') periodInMinutes?: number
  ) {
    const time = new Date(scheduledTime).toLocaleString();
    console.log(`Alarm "${name}" fired at ${time}`);
    
    if (periodInMinutes) {
      console.log(`This alarm repeats every ${periodInMinutes} minutes`);
    } else {
      console.log('This was a one-time alarm');
    }
  }
}
```

You can also get the entire alarm object:

```typescript
import { onAlarmFired, alarm, InjectableService } from 'deco-ext';

@InjectableService()
class AlarmHandler {
  @onAlarmFired()
  processAlarm(@alarm() alarmObj: browser.Alarms.Alarm) {
    // Access the entire alarm object
    console.log(`Alarm: ${alarmObj.name}`);
  }
}
```

## Alarm Object Structure

The Alarm object contains the following properties:

- `name`: The name of the alarm (string)
- `scheduledTime`: Time when the alarm is scheduled to fire, in milliseconds since the epoch (number)
- `periodInMinutes`: If this is a repeating alarm, the period of the alarm in minutes (optional number)

## Creating Alarms

Although not directly related to decorators, you can create alarms using the browser.alarms API:

```typescript
// Create a one-time alarm that will fire after 5 minutes
browser.alarms.create('reminderAlarm', { delayInMinutes: 5 });

// Create a repeating alarm that will fire every 30 minutes
browser.alarms.create('periodicCheck', { periodInMinutes: 30 });

// Create an alarm that fires at a specific time
const futureTime = Date.now() + 60000; // 1 minute from now
browser.alarms.create('scheduledTask', { when: futureTime });
```

## Implementation Details

This decorator uses a singleton pattern to ensure only one event listener is registered, and then routes events to all decorated methods. When an alarm fires:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorator can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 