---
title: History Decorators
---

# History Decorators

The History decorators allow you to easily respond to browser history events in your extension services.

## Method Decorators

### onHistoryVisited

This decorator handles browser history visit events. It attaches a listener to `browser.history.onVisited` events.

```typescript
import { historyItem, InjectableService, onHistoryVisited } from 'deco-ext';

@InjectableService()
class HistoryService {
  @onHistoryVisited()
  handleHistoryVisit(historyItem: browser.History.HistoryItem) {
    console.log('Page visited:', historyItem.url);
  }
}
```

The decorated method is called whenever a user visits a page that gets added to the browser history. By default, the method receives the complete `historyItem` object which includes details like URL, title, and visit time.

### onHistoryVisitRemoved

This decorator handles browser history deletion events. It attaches a listener to `browser.history.onVisitRemoved` events.

```typescript
import { InjectableService, onHistoryVisitRemoved, removedInfo } from 'deco-ext';
import browser from 'webextension-polyfill'

@InjectableService()
class HistoryCleanupService {
  @onHistoryVisitRemoved()
  handleHistoryRemoval(removed: browser.History.OnVisitRemovedRemovedType) {
    if (removed.allHistory) {
      console.log('All browsing history was cleared');
    } else {
      console.log(`${removed.urls.length} URLs were removed from history`);
    }
  }
}
```

The decorated method is called whenever history entries are removed. It receives information about which URLs were removed or if all history was cleared.

## Parameter Decorators

The library also provides parameter decorators to extract specific properties from history events:

### historyItem

Used with `onHistoryVisited` to extract specific properties from the history item:

```typescript
import { historyItem, InjectableService, onHistoryVisited } from 'deco-ext';

@InjectableService()
class HistoryMonitorService {
  @onHistoryVisited()
  logVisits(
    @historyItem('url') url: string,
    @historyItem('title') title: string,
    @historyItem('lastVisitTime') time: number
  ) {
    console.log(`Visited: ${title} (${url}) at ${new Date(time).toLocaleString()}`);
  }
}
```

### removedInfo

Used with `onHistoryVisitRemoved` to extract specific properties from the removed info:

```typescript
import { InjectableService, onHistoryVisitRemoved, removedInfo } from 'deco-ext';

@InjectableService()
class HistoryCleanupService {
  @onHistoryVisitRemoved()
  logRemovals(
    @removedInfo('allHistory') allCleared: boolean,
    @removedInfo('urls') removedUrls: string[]
  ) {
    if (allCleared) {
      console.log('Complete history purge detected');
    } else {
      console.log(`Removed URLs: ${removedUrls.join(', ')}`);
    }
  }
}
```

## Type Definitions

The decorators use the following types from the `browser.History` API:

```typescript
// HistoryItem structure
interface HistoryItem {
  id: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
  typedCount?: number;
}

// OnVisitRemovedRemovedType structure
interface OnVisitRemovedRemovedType {
  allHistory: boolean;
  urls?: string[];
}
```

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. They also handle class instantiation and dependency injection through the library's service container.