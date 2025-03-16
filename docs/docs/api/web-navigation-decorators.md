---
sidebar_position: 5
title: Web Navigation Decorators
---

# Web Navigation Decorators

The Web Navigation decorators allow you to easily respond to browser navigation events in your extension services. These decorators provide a clean way to handle various stages of page navigation.

## Method Decorators

### onBeforeNavigate

This decorator handles events that fire when navigation is about to occur.

```typescript
import { onBeforeNavigate, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onBeforeNavigate()
  handleBeforeNavigate(details: browser.WebNavigation.OnBeforeNavigateDetailsType) {
    console.log('Navigation starting to:', details.url);
    console.log('In tab:', details.tabId);
  }
}
```

With parameter decorator:

```typescript
import { onBeforeNavigate, navigationDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onBeforeNavigate()
  logNavigation(
    @navigationDetails('url') url: string,
    @navigationDetails('tabId') tabId: number,
    @navigationDetails('timeStamp') time: number
  ) {
    console.log(`Navigation to ${url} in tab ${tabId} at ${new Date(time).toLocaleString()}`);
  }
}
```

### onNavigationCommitted

This decorator handles events that fire when a navigation is committed.

```typescript
import { onNavigationCommitted, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onNavigationCommitted()
  handleCommitted(details: browser.WebNavigation.OnCommittedDetailsType) {
    console.log('Navigation committed to:', details.url);
    console.log('Transition type:', details.transitionType);
  }
}
```

With parameter decorator:

```typescript
import { onNavigationCommitted, navigationCommittedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onNavigationCommitted()
  handleCommitted(
    @navigationCommittedDetails('url') url: string,
    @navigationCommittedDetails('transitionType') transitionType: string
  ) {
    console.log(`Navigation committed to: ${url}`);
    console.log(`Transition type: ${transitionType}`);
  }
}
```

### onNavigationCompleted

This decorator handles events that fire when a navigation is completed.

```typescript
import { onNavigationCompleted, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onNavigationCompleted()
  handleCompleted(details: browser.WebNavigation.OnCompletedDetailsType) {
    console.log('Navigation completed to:', details.url);
  }
}
```

With parameter decorator:

```typescript
import { onNavigationCompleted, navigationCompletedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onNavigationCompleted()
  handleCompleted(
    @navigationCompletedDetails('url') url: string,
    @navigationCompletedDetails('tabId') tabId: number
  ) {
    console.log(`Navigation completed to ${url} in tab ${tabId}`);
  }
}
```

### onDOMContentLoaded

This decorator handles events that fire when the DOM content of a page has been loaded.

```typescript
import { onDOMContentLoaded, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onDOMContentLoaded()
  handleDOMContentLoaded(details: browser.WebNavigation.OnDOMContentLoadedDetailsType) {
    console.log('DOM content loaded for:', details.url);
  }
}
```

With parameter decorator:

```typescript
import { onDOMContentLoaded, domContentLoadedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onDOMContentLoaded()
  handleDOMContentLoaded(
    @domContentLoadedDetails('url') url: string,
    @domContentLoadedDetails('frameId') frameId: number
  ) {
    console.log(`DOM content loaded for ${url} in frame ${frameId}`);
  }
}
```

### onNavigationError

This decorator handles events that fire when a navigation fails due to an error.

```typescript
import { onNavigationError, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onNavigationError()
  handleError(arg: { details: browser.WebNavigation.OnErrorOccurredDetailsType }) {
    console.log('Navigation error for:', arg.details.url);
    console.log('Error:', arg.details.error);
  }
}
```

With parameter decorator:

```typescript
import { onNavigationError, navigationErrorDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onNavigationError()
  handleError(
    @navigationErrorDetails('url') url: string,
    @navigationErrorDetails('error') error: string
  ) {
    console.log(`Navigation error for ${url}: ${error}`);
  }
}
```

### onHistoryStateUpdated

This decorator handles events that fire when the page's history state is updated (e.g., via pushState/replaceState).

```typescript
import { onHistoryStateUpdated, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onHistoryStateUpdated()
  handleHistoryUpdate(details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType) {
    console.log('History state updated for:', details.url);
    console.log('Transition type:', details.transitionType);
  }
}
```

With parameter decorator:

```typescript
import { onHistoryStateUpdated, historyStateUpdatedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onHistoryStateUpdated()
  handleHistoryUpdate(
    @historyStateUpdatedDetails('url') url: string,
    @historyStateUpdatedDetails('transitionType') transitionType: string
  ) {
    console.log(`History state updated for ${url}`);
    console.log(`Transition type: ${transitionType}`);
  }
}
```

### onReferenceFragmentUpdated

This decorator handles events that fire when the fragment identifier of a URL changes (the part after the '#').

```typescript
import { onReferenceFragmentUpdated, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onReferenceFragmentUpdated()
  handleFragmentUpdate(details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType) {
    console.log('Fragment updated for:', details.url);
  }
}
```

With parameter decorator:

```typescript
import { onReferenceFragmentUpdated, referenceFragmentUpdatedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onReferenceFragmentUpdated()
  handleFragmentUpdate(
    @referenceFragmentUpdatedDetails('url') url: string,
    @referenceFragmentUpdatedDetails('tabId') tabId: number
  ) {
    console.log(`Fragment updated for ${url} in tab ${tabId}`);
  }
}
```

### onTabReplaced

This decorator handles events that fire when the contents of a tab is replaced by a different (usually previously pre-rendered) tab.

```typescript
import { onTabReplaced, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onTabReplaced()
  handleTabReplaced(details: browser.WebNavigation.OnTabReplacedDetailsType) {
    console.log(`Tab ${details.replacedTabId} was replaced by tab ${details.tabId}`);
  }
}
```

With parameter decorator:

```typescript
import { onTabReplaced, tabReplacedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationService {
  @onTabReplaced()
  handleReplacement(
    @tabReplacedDetails('replacedTabId') oldTabId: number,
    @tabReplacedDetails('tabId') newTabId: number
  ) {
    console.log(`Tab ${oldTabId} was replaced by tab ${newTabId}`);
  }
}
```

## Parameter Decorators

Each method decorator has a corresponding parameter decorator that can be used to extract specific properties from the navigation details:

| Method Decorator | Parameter Decorator | Used With |
|------------------|-------------------|-----------|
| `onBeforeNavigate` | `navigationDetails` | `browser.WebNavigation.OnBeforeNavigateDetailsType` |
| `onNavigationCommitted` | `navigationCommittedDetails` | `browser.WebNavigation.OnCommittedDetailsType` |
| `onNavigationCompleted` | `navigationCompletedDetails` | `browser.WebNavigation.OnCompletedDetailsType` |
| `onDOMContentLoaded` | `domContentLoadedDetails` | `browser.WebNavigation.OnDOMContentLoadedDetailsType` |
| `onNavigationError` | `navigationErrorDetails` | `browser.WebNavigation.OnErrorOccurredDetailsType` |
| `onHistoryStateUpdated` | `historyStateUpdatedDetails` | `browser.WebNavigation.OnHistoryStateUpdatedDetailsType` |
| `onReferenceFragmentUpdated` | `referenceFragmentUpdatedDetails` | `browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType` |
| `onTabReplaced` | `tabReplacedDetails` | `browser.WebNavigation.OnTabReplacedDetailsType` |

## Common Detail Properties

Most navigation events include these common properties:

- `tabId`: The ID of the tab in which the navigation occurred
- `url`: The URL to which the navigation occurred
- `frameId`: The ID of the frame in which the navigation occurred (0 is the main frame)
- `timeStamp`: The time when the navigation occurred, in milliseconds since the epoch
- `processId`: The ID of the process running the renderer for this frame

Transition-related events may also include:

- `transitionType`: The type of transition (e.g., "link", "typed", "auto_bookmark")
- `transitionQualifiers`: Array of qualifiers describing the transition

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a navigation event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.

## Future Enhancements

The implementation includes TODO comments indicating planned filtering options for several navigation events, which would allow you to filter events based on URL patterns or other criteria. 