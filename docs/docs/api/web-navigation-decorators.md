---
title: Web Navigation Decorators
---

# Web Navigation Decorators

The Web Navigation decorators allow you to easily respond to browser navigation events in your extension services. These decorators provide a clean way to monitor and respond to page navigation, loading states, and errors.

## Method Decorators

### onBeforeNavigate

This decorator handles events that fire before a navigation event begins.

```typescript
import { onBeforeNavigate, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationTracker {
  @onBeforeNavigate()
  handleNavigation(details: browser.WebNavigation.OnBeforeNavigateDetailsType) {
    console.log(`Navigation starting for tab ${details.tabId}`);
    console.log(`Navigating to: ${details.url}`);
    
    // Track or respond to the new navigation
    this.logNavigation(details.url, details.tabId);
  }
  
  private logNavigation(url: string, tabId: number) {
    // Log navigation or perform other actions
  }
}
```

With parameter decorator:

```typescript
import { onBeforeNavigate, navigationDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationMonitor {
  @onBeforeNavigate()
  trackNavigation(
    @navigationDetails('tabId') tabId: number,
    @navigationDetails('url') url: string,
    @navigationDetails('frameId') frameId: number
  ) {
    if (frameId === 0) {
      console.log(`Main frame navigation in tab ${tabId}`);
      console.log(`Navigating to: ${url}`);
      this.analyzeNavigation(url);
    } else {
      console.log(`Subframe navigation to ${url}`);
    }
  }
  
  private analyzeNavigation(url: string) {
    // Analyze the navigation target
  }
}
```

### onNavigationCommitted

This decorator handles events that fire when a navigation is committed.

```typescript
import { onNavigationCommitted, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationMonitor {
  @onNavigationCommitted()
  handleCommitted(details: browser.WebNavigation.OnCommittedDetailsType) {
    console.log(`Navigation committed in tab ${details.tabId}`);
    console.log(`URL: ${details.url}`);
    console.log(`Transition type: ${details.transitionType}`);
    
    // Respond to committed navigation
    if (details.transitionType === 'typed') {
      console.log('User typed this URL directly');
    }
  }
}
```

With parameter decorator:

```typescript
import { onNavigationCommitted, navigationCommittedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationMonitor {
  @onNavigationCommitted()
  trackCommitted(
    @navigationCommittedDetails('tabId') tabId: number,
    @navigationCommittedDetails('url') url: string,
    @navigationCommittedDetails('transitionType') transitionType: string,
    @navigationCommittedDetails('transitionQualifiers') qualifiers: string[]
  ) {
    console.log(`Tab ${tabId} navigation committed to ${url}`);
    console.log(`Transition: ${transitionType}`);
    
    if (qualifiers.includes('from_address_bar')) {
      console.log('Navigation originated from address bar');
    }
  }
}
```

### onNavigationCompleted

This decorator handles events that fire when a navigation is completed.

```typescript
import { onNavigationCompleted, InjectableService } from 'deco-ext';

@InjectableService()
class PageLoadTracker {
  @onNavigationCompleted()
  handleComplete(details: browser.WebNavigation.OnCompletedDetailsType) {
    console.log(`Navigation completed in tab ${details.tabId}`);
    console.log(`Loaded: ${details.url}`);
    
    // Perform actions after navigation completes
    this.analyzePage(details.tabId, details.url);
  }
  
  private analyzePage(tabId: number, url: string) {
    // Analyze the loaded page
  }
}
```

With parameter decorator:

```typescript
import { onNavigationCompleted, navigationCompletedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class PageLoadTracker {
  @onNavigationCompleted()
  trackCompletion(
    @navigationCompletedDetails('tabId') tabId: number,
    @navigationCompletedDetails('url') url: string,
    @navigationCompletedDetails('frameId') frameId: number,
    @navigationCompletedDetails('timeStamp') timestamp: number
  ) {
    const loadTime = new Date(timestamp).toLocaleTimeString();
    console.log(`Tab ${tabId} frame ${frameId} completed loading ${url} at ${loadTime}`);
  }
}
```

### onDOMContentLoaded

This decorator handles events that fire when the DOM content of a page is loaded.

```typescript
import { onDOMContentLoaded, InjectableService } from 'deco-ext';

@InjectableService()
class DOMLoadMonitor {
  @onDOMContentLoaded()
  handleDOMLoaded(details: browser.WebNavigation.OnDOMContentLoadedDetailsType) {
    console.log(`DOM loaded in tab ${details.tabId}`);
    console.log(`URL: ${details.url}`);
    console.log(`Time: ${new Date(details.timeStamp).toLocaleTimeString()}`);
    
    // Respond to DOM content loaded event
    this.injectContentIfNeeded(details.tabId, details.url);
  }
  
  private injectContentIfNeeded(tabId: number, url: string) {
    // Potentially inject content scripts or perform other actions
  }
}
```

With parameter decorator:

```typescript
import { onDOMContentLoaded, domContentLoadedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class DOMLoadMonitor {
  @onDOMContentLoaded()
  trackDOMLoad(
    @domContentLoadedDetails('tabId') tabId: number,
    @domContentLoadedDetails('url') url: string,
    @domContentLoadedDetails('frameId') frameId: number
  ) {
    if (frameId === 0) {
      console.log(`Main document DOM loaded in tab ${tabId}`);
      console.log(`URL: ${url}`);
      
      if (url.includes('example.com')) {
        this.enhancePage(tabId);
      }
    }
  }
  
  private enhancePage(tabId: number) {
    // Enhance the page after DOM is loaded
  }
}
```

### onNavigationError

This decorator handles events that fire when a navigation fails due to an error.

```typescript
import { onNavigationError, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationErrorHandler {
  @onNavigationError()
  handleError(details: browser.WebNavigation.OnErrorOccurredDetailsType) {
    console.log(`Navigation error in tab ${details.tabId}`);
    console.log(`Failed URL: ${details.url}`);
    console.log(`Error: ${details.error}`);
    
    // Handle the navigation error
    this.logNavigationError(details.tabId, details.url, details.error);
  }
  
  private logNavigationError(tabId: number, url: string, error: string) {
    // Log error or notify user
  }
}
```

With parameter decorator:

```typescript
import { onNavigationError, navigationErrorDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationErrorHandler {
  @onNavigationError()
  trackErrors(
    @navigationErrorDetails('tabId') tabId: number,
    @navigationErrorDetails('url') url: string,
    @navigationErrorDetails('error') error: string,
    @navigationErrorDetails('frameId') frameId: number
  ) {
    if (frameId === 0) {
      console.log(`Main frame navigation error in tab ${tabId}`);
      console.log(`Failed URL: ${url}`);
      console.log(`Error: ${error}`);
      
      // Provide fallback content or suggest alternatives
      this.suggestAlternatives(tabId, url, error);
    }
  }
  
  private suggestAlternatives(tabId: number, url: string, error: string) {
    // Suggest alternative actions based on the error
  }
}
```

### onHistoryStateUpdated

This decorator handles events that fire when the page's history state is updated (pushState/replaceState).

```typescript
import { onHistoryStateUpdated, InjectableService } from 'deco-ext';

@InjectableService()
class SPANavigationTracker {
  @onHistoryStateUpdated()
  handleHistoryUpdate(details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType) {
    console.log(`History state updated in tab ${details.tabId}`);
    console.log(`New URL: ${details.url}`);
    
    // Track single-page app navigation
    this.trackSPANavigation(details.tabId, details.url);
  }
  
  private trackSPANavigation(tabId: number, url: string) {
    // Track single-page application navigation changes
  }
}
```

With parameter decorator:

```typescript
import { onHistoryStateUpdated, historyStateUpdatedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class SPANavigationTracker {
  @onHistoryStateUpdated()
  trackHistoryChanges(
    @historyStateUpdatedDetails('tabId') tabId: number,
    @historyStateUpdatedDetails('url') url: string,
    @historyStateUpdatedDetails('transitionType') transitionType: string
  ) {
    console.log(`SPA navigation in tab ${tabId}`);
    console.log(`New virtual page: ${url}`);
    console.log(`Transition type: ${transitionType}`);
    
    // Update analytics or other tracking
    this.recordVirtualPageview(url);
  }
  
  private recordVirtualPageview(url: string) {
    // Record SPA virtual pageview
  }
}
```

### onReferenceFragmentUpdated

This decorator handles events that fire when the URL fragment (part after #) changes.

```typescript
import { onReferenceFragmentUpdated, InjectableService } from 'deco-ext';

@InjectableService()
class FragmentTracker {
  @onReferenceFragmentUpdated()
  handleFragmentChange(details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType) {
    console.log(`URL fragment changed in tab ${details.tabId}`);
    console.log(`URL with new fragment: ${details.url}`);
    
    // Extract and use the fragment
    const fragment = new URL(details.url).hash;
    console.log(`Fragment: ${fragment}`);
    
    this.respondToFragmentChange(details.tabId, fragment);
  }
  
  private respondToFragmentChange(tabId: number, fragment: string) {
    // Respond to fragment change (e.g., for in-page navigation)
  }
}
```

With parameter decorator:

```typescript
import { onReferenceFragmentUpdated, referenceFragmentUpdatedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class FragmentTracker {
  @onReferenceFragmentUpdated()
  trackFragmentChanges(
    @referenceFragmentUpdatedDetails('tabId') tabId: number,
    @referenceFragmentUpdatedDetails('url') url: string,
    @referenceFragmentUpdatedDetails('timeStamp') time: number
  ) {
    const fragment = new URL(url).hash.substring(1); // Remove the # character
    
    console.log(`Tab ${tabId} changed fragment to: ${fragment}`);
    console.log(`At time: ${new Date(time).toLocaleTimeString()}`);
    
    // Track fragment-based navigation
    this.logFragmentNavigation(fragment);
  }
  
  private logFragmentNavigation(fragment: string) {
    // Log or respond to fragment-based navigation
  }
}
```

### onTabReplaced

This decorator handles events that fire when a tab is replaced by another tab.

```typescript
import { onTabReplaced, InjectableService } from 'deco-ext';

@InjectableService()
class TabReplacementTracker {
  @onTabReplaced()
  handleTabReplacement(details: browser.WebNavigation.OnTabReplacedDetailsType) {
    console.log(`Tab replacement occurred`);
    console.log(`Replaced tab ID: ${details.replacedTabId}`);
    console.log(`New tab ID: ${details.tabId}`);
    
    // Update any tab tracking
    this.updateTabReferences(details.replacedTabId, details.tabId);
  }
  
  private updateTabReferences(oldTabId: number, newTabId: number) {
    // Update any data structures that reference the old tab ID
  }
}
```

With parameter decorator:

```typescript
import { onTabReplaced, tabReplacedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabReplacementTracker {
  @onTabReplaced()
  trackTabReplacement(
    @tabReplacedDetails('replacedTabId') oldTabId: number,
    @tabReplacedDetails('tabId') newTabId: number,
    @tabReplacedDetails('timeStamp') time: number
  ) {
    console.log(`Tab ${oldTabId} was replaced by tab ${newTabId}`);
    console.log(`At time: ${new Date(time).toLocaleTimeString()}`);
    
    // Transfer any tab-specific state
    this.transferTabState(oldTabId, newTabId);
  }
  
  private transferTabState(oldTabId: number, newTabId: number) {
    // Transfer any state or tracking from old tab to new tab
  }
}
```

## Filtering Events

All web navigation decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onNavigationCompleted, onBeforeNavigate, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationFilterService {
  // Only handle navigation to specific domains
  @onNavigationCompleted({ 
    filter: (details) => {
      const url = new URL(details.url);
      return url.hostname.includes('github.com') || url.hostname.includes('stackoverflow.com');
    }
  })
  handleDeveloperSites(details: browser.WebNavigation.OnCompletedDetailsType) {
    console.log(`Navigation completed to developer site: ${details.url}`);
    this.trackDeveloperActivity(details);
  }

  // Only handle main frame navigation (not subframes)
  @onBeforeNavigate({ 
    filter: (details) => details.frameId === 0 
  })
  handleMainFrameNavigation(details: browser.WebNavigation.OnBeforeNavigateDetailsType) {
    console.log(`Main frame navigating to: ${details.url}`);
    this.prepareForNavigation(details);
  }

  // Only handle HTTPS navigation
  @onNavigationCompleted({ 
    filter: (details) => details.url.startsWith('https://') 
  })
  handleSecureNavigation(details: browser.WebNavigation.OnCompletedDetailsType) {
    console.log(`Secure navigation completed: ${details.url}`);
    this.processSecureSite(details);
  }

  private trackDeveloperActivity(details: browser.WebNavigation.OnCompletedDetailsType) {
    // Track developer site activity
  }

  private prepareForNavigation(details: browser.WebNavigation.OnBeforeNavigateDetailsType) {
    // Prepare for main frame navigation
  }

  private processSecureSite(details: browser.WebNavigation.OnCompletedDetailsType) {
    // Process secure site navigation
  }
}
```

### Advanced Filtering Examples

```typescript
import { onNavigationCommitted, onErrorOccurred, InjectableService } from 'deco-ext';

// Module-level configuration and tracking (accessible to filters)
const blockedDomains = new Set(['malicious-site.com', 'spam-site.net']);
const importantTabs = new Set<number>();

@InjectableService()
class AdvancedNavigationService {

  // Filter navigation in specific tabs only
  @onNavigationCommitted({ 
    filter: (details) => importantTabs.has(details.tabId) 
  })
  handleImportantTabNavigation(details: browser.WebNavigation.OnCommittedDetailsType) {
    console.log(`Important tab navigation: ${details.url}`);
    this.trackImportantNavigation(details);
  }

  // Filter and block navigation to malicious domains
  @onBeforeNavigate({ 
    filter: (details) => {
      try {
        const url = new URL(details.url);
        const isBlocked = blockedDomains.has(url.hostname);
        if (isBlocked) {
          console.warn(`Blocked navigation to: ${details.url}`);
        }
        return isBlocked;
      } catch {
        return false;
      }
    }
  })
  handleBlockedNavigation(details: browser.WebNavigation.OnBeforeNavigateDetailsType) {
    console.log('Handling blocked navigation attempt');
    this.redirectToSafePage(details.tabId);
  }

  // Filter errors based on error type and context
  @onErrorOccurred({ 
    filter: (details) => {
      const criticalErrors = ['net::ERR_CONNECTION_REFUSED', 'net::ERR_CERT_AUTHORITY_INVALID'];
      return criticalErrors.includes(details.error);
    }
  })
  handleCriticalNavigationErrors(details: browser.WebNavigation.OnErrorOccurredDetailsType) {
    console.log(`Critical navigation error: ${details.error} on ${details.url}`);
    this.handleSecurityError(details);
  }

  // Filter based on navigation timing and performance
  @onNavigationCompleted({ 
    filter: (details) => {
      const navigationTime = details.timeStamp - (details as any).startTime || 0;
      return navigationTime > 5000; // Slow navigation (>5 seconds)
    }
  })
  handleSlowNavigation(details: browser.WebNavigation.OnCompletedDetailsType) {
    console.log(`Slow navigation detected: ${details.url}`);
    this.optimizePerformance(details);
  }

  private trackImportantNavigation(details: browser.WebNavigation.OnCommittedDetailsType) {
    // Track navigation in important tabs
  }

  private redirectToSafePage(tabId: number) {
    // Redirect to a safe page
    browser.tabs.update(tabId, { url: 'chrome://newtab' });
  }



  private handleSecurityError(details: browser.WebNavigation.OnErrorOccurredDetailsType) {
    // Handle security-related navigation errors
  }

  private optimizePerformance(details: browser.WebNavigation.OnCompletedDetailsType) {
    // Optimize performance for slow-loading sites
  }
}
```

### Filter with Parameter Decorators

```typescript
import { onNavigationCompleted, webNavigationDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationTrackingService {
  @onNavigationCompleted({ 
    filter: (details) => details.frameId === 0 && details.url.includes('shop') // Shopping sites in main frame
  })
  trackShoppingSites(
    @webNavigationDetails('url') url: string,
    @webNavigationDetails('tabId') tabId: number,
    @webNavigationDetails('timeStamp') timestamp: number
  ) {
    console.log(`Shopping site loaded in tab ${tabId}: ${url} at ${new Date(timestamp)}`);
    this.analyzeShoppingSite(url, tabId);
  }

  private analyzeShoppingSite(url: string, tabId: number) {
    // Analyze shopping site for deals or price tracking
  }
}
```

## Parameter Decorators

### navigationDetails

Used with `onBeforeNavigate` to extract specific properties from the navigation details:

```typescript
import { onBeforeNavigate, navigationDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationTracker {
  @onBeforeNavigate()
  trackNavigation(
    @navigationDetails('tabId') tabId: number,
    @navigationDetails('url') url: string,
    @navigationDetails('frameId') frameId: number,
    @navigationDetails('timeStamp') timestamp: number
  ) {
    const navTime = new Date(timestamp).toLocaleTimeString();
    console.log(`Tab ${tabId} frame ${frameId} navigating to ${url} at ${navTime}`);
  }
}
```

### navigationCommittedDetails

Used with `onNavigationCommitted` to extract specific properties from the committed navigation details:

```typescript
import { onNavigationCommitted, navigationCommittedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationTracker {
  @onNavigationCommitted()
  trackCommit(
    @navigationCommittedDetails('tabId') tabId: number,
    @navigationCommittedDetails('url') url: string,
    @navigationCommittedDetails('transitionType') transitionType: string,
    @navigationCommittedDetails('transitionQualifiers') qualifiers: string[]
  ) {
    console.log(`Tab ${tabId} committed navigation to ${url}`);
    console.log(`Transition: ${transitionType}`);
    console.log(`Qualifiers: ${qualifiers.join(', ')}`);
  }
}
```

### navigationCompletedDetails

Used with `onNavigationCompleted` to extract specific properties from the completed navigation details:

```typescript
import { onNavigationCompleted, navigationCompletedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class NavigationTracker {
  @onNavigationCompleted()
  trackCompletion(
    @navigationCompletedDetails('tabId') tabId: number,
    @navigationCompletedDetails('url') url: string,
    @navigationCompletedDetails('frameId') frameId: number,
    @navigationCompletedDetails('timeStamp') timestamp: number
  ) {
    const loadTime = new Date(timestamp).toLocaleTimeString();
    console.log(`Tab ${tabId} frame ${frameId} completed loading ${url} at ${loadTime}`);
  }
}
```

### domContentLoadedDetails

Used with `onDOMContentLoaded` to extract specific properties from the DOM loaded details:

```typescript
import { onDOMContentLoaded, domContentLoadedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class DOMTracker {
  @onDOMContentLoaded()
  trackDOMLoad(
    @domContentLoadedDetails('tabId') tabId: number,
    @domContentLoadedDetails('url') url: string,
    @domContentLoadedDetails('frameId') frameId: number,
    @domContentLoadedDetails('timeStamp') timestamp: number
  ) {
    const loadTime = new Date(timestamp).toLocaleTimeString();
    console.log(`Tab ${tabId} frame ${frameId} DOM loaded for ${url} at ${loadTime}`);
  }
}
```

### navigationErrorDetails

Used with `onNavigationError` to extract specific properties from the navigation error details:

```typescript
import { onNavigationError, navigationErrorDetails, InjectableService } from 'deco-ext';

@InjectableService()
class ErrorTracker {
  @onNavigationError()
  trackError(
    @navigationErrorDetails('tabId') tabId: number,
    @navigationErrorDetails('url') url: string,
    @navigationErrorDetails('error') errorCode: string,
    @navigationErrorDetails('timeStamp') timestamp: number
  ) {
    const errorTime = new Date(timestamp).toLocaleTimeString();
    console.log(`Tab ${tabId} encountered error '${errorCode}' loading ${url} at ${errorTime}`);
  }
}
```

### historyStateUpdatedDetails

Used with `onHistoryStateUpdated` to extract specific properties from the history state updated details:

```typescript
import { onHistoryStateUpdated, historyStateUpdatedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class SPATracker {
  @onHistoryStateUpdated()
  trackStateChange(
    @historyStateUpdatedDetails('tabId') tabId: number,
    @historyStateUpdatedDetails('url') url: string,
    @historyStateUpdatedDetails('frameId') frameId: number,
    @historyStateUpdatedDetails('transitionType') transitionType: string
  ) {
    console.log(`Tab ${tabId} frame ${frameId} history state updated to ${url}`);
    console.log(`Transition type: ${transitionType}`);
  }
}
```

### referenceFragmentUpdatedDetails

Used with `onReferenceFragmentUpdated` to extract specific properties from the fragment updated details:

```typescript
import { onReferenceFragmentUpdated, referenceFragmentUpdatedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class FragmentTracker {
  @onReferenceFragmentUpdated()
  trackFragmentChange(
    @referenceFragmentUpdatedDetails('tabId') tabId: number,
    @referenceFragmentUpdatedDetails('url') url: string,
    @referenceFragmentUpdatedDetails('frameId') frameId: number,
    @referenceFragmentUpdatedDetails('transitionType') transitionType: string
  ) {
    const fragment = new URL(url).hash;
    console.log(`Tab ${tabId} frame ${frameId} fragment changed to ${fragment}`);
    console.log(`Transition type: ${transitionType}`);
  }
}
```

### tabReplacedDetails

Used with `onTabReplaced` to extract specific properties from the tab replaced details:

```typescript
import { onTabReplaced, tabReplacedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabTracker {
  @onTabReplaced()
  trackReplacement(
    @tabReplacedDetails('replacedTabId') oldTabId: number,
    @tabReplacedDetails('tabId') newTabId: number,
    @tabReplacedDetails('timeStamp') timestamp: number
  ) {
    const replaceTime = new Date(timestamp).toLocaleTimeString();
    console.log(`Tab ${oldTabId} was replaced by tab ${newTabId} at ${replaceTime}`);
  }
}
```

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a web navigation event occurs:

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