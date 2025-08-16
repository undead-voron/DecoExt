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

## Filtering Events

All history decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onHistoryVisited, InjectableService } from 'deco-ext';

@InjectableService()
class HistoryFilterService {
  // Only track visits to specific domains
  @onHistoryVisited({ 
    filter: (historyItem) => {
      const url = historyItem.url;
      return url?.includes('github.com') || url?.includes('stackoverflow.com');
    }
  })
  handleDeveloperSiteVisits(historyItem: browser.History.HistoryItem) {
    console.log(`Developer site visited: ${historyItem.url}`);
  }

  // Only track visits during work hours
  @onHistoryVisited({ 
    filter: (historyItem) => {
      const hour = new Date(historyItem.lastVisitTime || Date.now()).getHours();
      return hour >= 9 && hour <= 17;
    }
  })
  handleWorkHourVisits(historyItem: browser.History.HistoryItem) {
    console.log(`Work hour visit: ${historyItem.title} at ${historyItem.url}`);
  }
}
```

### Advanced Filtering Examples

```typescript
import { onHistoryVisitRemoved, InjectableService } from 'deco-ext';

// Module-level configuration (accessible to filters)
const sensitiveKeywords = ['password', 'login', 'bank'];

@InjectableService()
class AdvancedHistoryService {

  // Only handle removal of sensitive pages
  @onHistoryVisitRemoved({ 
    filter: async (removed) => {
      if (removed.allHistory) return true; // Always handle complete history clearing
      
      // Check if any removed URLs contain sensitive keywords
      return removed.urls.some(url => 
        sensitiveKeywords.some(keyword => url.toLowerCase().includes(keyword))
      );
    }
  })
  handleSensitiveHistoryRemoval(removed: browser.History.OnVisitRemovedRemovedType) {
    if (removed.allHistory) {
      console.log('All history cleared - including sensitive data');
    } else {
      console.log(`${removed.urls.length} sensitive URLs removed from history`);
    }
  }

  // Filter visits based on page content analysis
  @onHistoryVisited({ 
    filter: (historyItem) => {
      // Only track pages with meaningful titles (not empty or generic)
      const title = historyItem.title;
      return title && 
             title.length > 5 && 
             !title.includes('Untitled') && 
             !title.includes('New Tab');
    }
  })
  handleMeaningfulPageVisits(historyItem: browser.History.HistoryItem) {
    console.log(`Meaningful page visit: "${historyItem.title}"`);
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onHistoryVisited, historyItem, InjectableService } from 'deco-ext';

@InjectableService()
class ProductiveHistoryService {
  @onHistoryVisited({ 
    filter: (historyItem) => historyItem.visitCount && historyItem.visitCount > 5 // Frequently visited sites
  })
  trackFrequentlyVisitedSites(
    @historyItem('url') url: string,
    @historyItem('title') title: string,
    @historyItem('visitCount') visitCount: number
  ) {
    console.log(`Frequent site: "${title}" (${visitCount} visits) - ${url}`);
  }
}
```

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