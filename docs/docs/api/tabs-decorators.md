---
title: Tabs Decorators
---

# Tabs Decorators

The Tabs decorators allow you to easily respond to browser tab events in your extension services. These decorators provide a clean way to handle tab creation, activation, updates, and removal.

## Method Decorators

### onTabActivated

This decorator handles events that fire when a tab becomes active.

```typescript
import { onTabActivated, InjectableService } from 'deco-ext';

@InjectableService()
class TabMonitor {
  @onTabActivated()
  handleTabActivation(activeInfo: browser.Tabs.OnActivatedActiveInfoType) {
    console.log(`Tab ${activeInfo.tabId} became active in window ${activeInfo.windowId}`);
    
    // Perform actions when a tab is activated
    this.trackActiveTab(activeInfo.tabId);
  }
  
  private trackActiveTab(tabId: number) {
    // Track or respond to the newly active tab
  }
}
```

With parameter decorator:

```typescript
import { onTabActivated, activatedTabDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabMonitor {
  @onTabActivated()
  trackTabFocus(
    @activatedTabDetails('tabId') tabId: number,
    @activatedTabDetails('windowId') windowId: number
  ) {
    console.log(`Tab ${tabId} became active in window ${windowId}`);
    
    // Now you can work directly with the extracted properties
    this.updateActiveTabIndicator(tabId);
  }
  
  private updateActiveTabIndicator(tabId: number) {
    // Update UI or state based on active tab
  }
}
```

### onTabCreated

This decorator handles events that fire when a new tab is created.

```typescript
import { onTabCreated, InjectableService } from 'deco-ext';

@InjectableService()
class TabTracker {
  @onTabCreated()
  handleNewTab(tab: browser.Tabs.Tab) {
    console.log(`New tab created with ID: ${tab.id}`);
    console.log(`Tab URL: ${tab.url}`);
    
    // Perform actions when a new tab is created
    if (tab.url?.startsWith('https://example.com')) {
      this.processExampleTab(tab);
    }
  }
  
  private processExampleTab(tab: browser.Tabs.Tab) {
    // Process tabs from a specific domain
  }
}
```

With parameter decorator:

```typescript
import { onTabCreated, createdTabDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabTracker {
  @onTabCreated()
  logNewTab(
    @createdTabDetails('id') tabId: number,
    @createdTabDetails('url') url: string,
    @createdTabDetails('index') position: number
  ) {
    console.log(`New tab created with ID ${tabId} at position ${position}`);
    
    if (url) {
      console.log(`Initial URL: ${url}`);
      this.categorizeTabByDomain(url);
    }
  }
  
  private categorizeTabByDomain(url: string) {
    // Categorize or track tabs based on domain
  }
}
```

### onTabRemoved

This decorator handles events that fire when a tab is closed.

```typescript
import { onTabRemoved, InjectableService } from 'deco-ext';

@InjectableService()
class TabCleanupService {
  @onTabRemoved()
  handleTabClosure(info: browser.Tabs.OnRemovedRemoveInfoType & { tabId: number }) {
    console.log(`Tab ${info.tabId} was closed`);
    
    if (info.isWindowClosing) {
      console.log(`Tab was closed because window ${info.windowId} is closing`);
    } else {
      console.log(`Tab was closed individually`);
    }
    
    // Clean up resources associated with the closed tab
    this.cleanupTabResources(info.tabId);
  }
  
  private cleanupTabResources(tabId: number) {
    // Remove cached data for the closed tab
  }
}
```

With parameter decorator:

```typescript
import { onTabRemoved, removedTabDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabCleanupService {
  @onTabRemoved()
  handleClosedTab(
    @removedTabDetails('tabId') tabId: number,
    @removedTabDetails('windowId') windowId: number,
    @removedTabDetails('isWindowClosing') isWindowClosing: boolean
  ) {
    if (isWindowClosing) {
      console.log(`Tab ${tabId} closed due to window ${windowId} closing`);
      this.handleWindowClosure(windowId);
    } else {
      console.log(`Tab ${tabId} closed individually in window ${windowId}`);
      this.removeTabFromTracking(tabId);
    }
  }
  
  private removeTabFromTracking(tabId: number) {
    // Remove tab from internal tracking
  }
  
  private handleWindowClosure(windowId: number) {
    // Handle window closure event
  }
}
```

### onTabUpdated

This decorator handles events that fire when a tab is updated.

```typescript
import { onTabUpdated, InjectableService } from 'deco-ext';

@InjectableService()
class PageLoadMonitor {
  @onTabUpdated()
  handleTabUpdate(arg: { 
    details: browser.Tabs.OnUpdatedChangeInfoType, 
    tabId: number, 
    tab: browser.Tabs.Tab 
  }) {
    console.log(`Tab ${arg.tabId} was updated`);
    
    // Check if the page finished loading
    if (arg.details.status === 'complete') {
      console.log(`Page fully loaded: ${arg.tab.url}`);
      this.analyzeLoadedPage(arg.tab);
    }
    
    // Check if the title changed
    if (arg.details.title) {
      console.log(`Title changed to: ${arg.details.title}`);
    }
  }
  
  private analyzeLoadedPage(tab: browser.Tabs.Tab) {
    // Process the fully loaded page
  }
}
```

With parameter decorators:

```typescript
import { onTabUpdated, tabUpdatedDetails, tabUpdatedTab, InjectableService } from 'deco-ext';

@InjectableService()
class PageMonitor {
  @onTabUpdated()
  trackPageChanges(
    @tabUpdatedDetails('status') status: string,
    @tabUpdatedDetails('title') title: string,
    @tabUpdatedTab('id') tabId: number,
    @tabUpdatedTab('url') url: string
  ) {
    // Track loading state changes
    if (status) {
      console.log(`Tab ${tabId} status: ${status}`);
      
      if (status === 'complete') {
        console.log(`Page loaded: ${title || 'Untitled'} (${url || 'about:blank'})`);
        this.indexPageContent(tabId, url, title);
      }
    }
    
    // Track title changes
    if (title) {
      console.log(`Tab ${tabId} title changed to: ${title}`);
      this.updateTabTitle(tabId, title);
    }
  }
  
  private indexPageContent(tabId: number, url: string, title: string) {
    // Index or process the content of the loaded page
  }
  
  private updateTabTitle(tabId: number, title: string) {
    // Update internal records of tab titles
  }
}
```

### onTabZoomChange

This decorator handles events that fire when a tab's zoom factor changes.

```typescript
import { onTabZoomChange, InjectableService } from 'deco-ext';

@InjectableService()
class ZoomMonitor {
  @onTabZoomChange()
  handleZoomChange(zoomChangeInfo: {
    tabId: number;
    oldZoomFactor: number;
    newZoomFactor: number;
    zoomSettings: browser.Tabs.ZoomSettings;
  }) {
    console.log(`Zoom changed for tab ${zoomChangeInfo.tabId}`);
    console.log(`Zoom factor changed from ${zoomChangeInfo.oldZoomFactor} to ${zoomChangeInfo.newZoomFactor}`);
    
    // Respond to zoom changes
    this.recordZoomPreference(zoomChangeInfo.tabId, zoomChangeInfo.newZoomFactor);
  }
  
  private recordZoomPreference(tabId: number, zoomFactor: number) {
    // Store user's zoom preferences
  }
}
```

With parameter decorators:

```typescript
import { onTabZoomChange, zoomChangeInfo, InjectableService } from 'deco-ext';

@InjectableService()
class ZoomTracker {
  @onTabZoomChange()
  logZoomChanges(
    @zoomChangeInfo('tabId') tabId: number,
    @zoomChangeInfo('oldZoomFactor') oldZoom: number,
    @zoomChangeInfo('newZoomFactor') newZoom: number,
    @zoomChangeInfo('zoomSettings') settings: browser.Tabs.ZoomSettings
  ) {
    const changePercentage = Math.round((newZoom / oldZoom - 1) * 100);
    
    console.log(`Tab ${tabId} zoom ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage)}%`);
    console.log(`Zoom mode: ${settings.mode}, Scope: ${settings.scope}`);
    
    // Save user's zoom preferences for this domain
    if (settings.scope === 'per-origin') {
      this.saveZoomPreference(tabId, newZoom);
    }
  }
  
  private saveZoomPreference(tabId: number, zoom: number) {
    // Save zoom preferences for the current site
  }
}
```

## Filtering Events

All tab decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onTabCreated, onTabUpdated, InjectableService } from 'deco-ext';

@InjectableService()
class TabFilterService {
  // Only handle tabs created with specific URLs
  @onTabCreated({ 
    filter: (tab) => tab.url?.startsWith('https://github.com') 
  })
  handleGitHubTabs(tab: browser.Tabs.Tab) {
    console.log(`GitHub tab created: ${tab.title}`);
  }

  // Only handle tabs that finish loading (not other update events)
  @onTabUpdated({ 
    filter: (arg) => arg.details.status === 'complete' 
  })
  handlePageLoadComplete(arg: { details: browser.Tabs.OnUpdatedChangeInfoType, tabId: number, tab: browser.Tabs.Tab }) {
    console.log(`Page finished loading: ${arg.tab.title}`);
  }
}
```

### Advanced Filtering Examples

```typescript
import { onTabActivated, onTabRemoved, InjectableService } from 'deco-ext';

// Module-level configuration for filters
const ZOOM_THRESHOLD = 0.25;
const MONITORED_DOMAINS = ['github.com', 'stackoverflow.com'];

@InjectableService()
class TabFilterService {
  // Only handle tab activation in specific windows
  @onTabActivated({ 
    filter: async (activeInfo) => {
      try {
        // You can use async logic in filters
        const window = await browser.windows.get(activeInfo.windowId);
        return window.type === 'normal'; // Skip popup windows
      } catch {
        return false; // Handle case where window doesn't exist
      }
    }
  })
  handleNormalWindowActivation(activeInfo: browser.Tabs.OnActivatedActiveInfoType) {
    console.log(`Tab ${activeInfo.tabId} activated in normal window`);
  }

  // Only handle tabs closed individually (not due to window closure)
  @onTabRemoved({ 
    filter: (info) => !info.isWindowClosing 
  })
  handleIndividualTabClosure(info: browser.Tabs.OnRemovedRemoveInfoType & { tabId: number }) {
    console.log(`Individual tab ${info.tabId} was closed`);
  }

  // Filter zoom changes based on zoom level threshold (using module-level constant)
  @onTabZoomChange({ 
    filter: (zoomInfo) => Math.abs(zoomInfo.newZoomFactor - 1.0) > ZOOM_THRESHOLD
  })
  handleSignificantZoomChange(zoomChangeInfo: {
    tabId: number;
    oldZoomFactor: number;
    newZoomFactor: number;
    zoomSettings: browser.Tabs.ZoomSettings;
  }) {
    console.log(`Significant zoom change in tab ${zoomChangeInfo.tabId}: ${zoomChangeInfo.newZoomFactor}`);
  }

  // Filter tabs from monitored domains using module-level data
  @onTabCreated({ 
    filter: (tab) => {
      if (!tab.url) return false;
      try {
        const url = new URL(tab.url);
        return MONITORED_DOMAINS.some(domain => url.hostname.includes(domain));
      } catch {
        return false;
      }
    }
  })
  handleMonitoredDomainTabs(tab: browser.Tabs.Tab) {
    console.log(`Tab created for monitored domain: ${tab.url}`);
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onTabUpdated, tabUpdatedDetails, tabUpdatedTab, InjectableService } from 'deco-ext';

@InjectableService()
class TabFilterService {
  @onTabUpdated({ 
    filter: (arg) => arg.details.title !== undefined // Only when title changes
  })
  handleTitleChange(
    @tabUpdatedDetails('title') newTitle: string,
    @tabUpdatedTab('id') tabId: number,
    @tabUpdatedTab('url') url: string
  ) {
    console.log(`Tab ${tabId} title changed to: "${newTitle}" for URL: ${url}`);
  }
}
```

## Parameter Decorators

### activatedTabDetails

Used with `onTabActivated` to extract specific properties from the activated tab details:

```typescript
import { onTabActivated, activatedTabDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabMonitor {
  @onTabActivated()
  trackTabFocus(
    @activatedTabDetails('tabId') tabId: number,
    @activatedTabDetails('windowId') windowId: number
  ) {
    console.log(`Tab ${tabId} became active in window ${windowId}`);
  }
}
```

### createdTabDetails

Used with `onTabCreated` to extract specific properties from the created tab:

```typescript
import { onTabCreated, createdTabDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabTracker {
  @onTabCreated()
  logNewTab(
    @createdTabDetails('id') tabId: number,
    @createdTabDetails('url') url: string,
    @createdTabDetails('index') position: number,
    @createdTabDetails('pinned') isPinned: boolean
  ) {
    console.log(`New tab created with ID ${tabId}`);
    console.log(`Position in window: ${position}`);
    console.log(`URL: ${url || 'about:blank'}`);
    console.log(`Pinned: ${isPinned ? 'Yes' : 'No'}`);
  }
}
```

### removedTabDetails

Used with `onTabRemoved` to extract specific properties from the removed tab details:

```typescript
import { onTabRemoved, removedTabDetails, InjectableService } from 'deco-ext';

@InjectableService()
class TabCleanupService {
  @onTabRemoved()
  handleClosedTab(
    @removedTabDetails('tabId') tabId: number,
    @removedTabDetails('windowId') windowId: number,
    @removedTabDetails('isWindowClosing') isWindowClosing: boolean
  ) {
    if (isWindowClosing) {
      console.log(`Tab ${tabId} closed due to window ${windowId} closing`);
    } else {
      console.log(`Tab ${tabId} closed individually in window ${windowId}`);
    }
  }
}
```

### tabUpdatedDetails

Used with `onTabUpdated` to extract specific properties from the change info object:

```typescript
import { onTabUpdated, tabUpdatedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class PageStateMonitor {
  @onTabUpdated()
  trackPageState(
    @tabUpdatedDetails('status') status: string,
    @tabUpdatedDetails('title') title: string,
    @tabUpdatedDetails('favIconUrl') favicon: string
  ) {
    if (status) {
      console.log(`Page status changed to: ${status}`);
      
      if (status === 'complete') {
        console.log('Page has finished loading');
      } else if (status === 'loading') {
        console.log('Page is currently loading');
      }
    }
    
    if (title) {
      console.log(`Page title updated: ${title}`);
    }
    
    if (favicon) {
      console.log(`Favicon changed: ${favicon}`);
    }
  }
}
```

### tabUpdatedTab

Used with `onTabUpdated` to extract specific properties from the tab object:

```typescript
import { onTabUpdated, tabUpdatedTab, InjectableService } from 'deco-ext';

@InjectableService()
class TabPropertiesMonitor {
  @onTabUpdated()
  trackTabProperties(
    @tabUpdatedTab('id') tabId: number,
    @tabUpdatedTab('url') url: string,
    @tabUpdatedTab('active') isActive: boolean,
    @tabUpdatedTab('pinned') isPinned: boolean
  ) {
    console.log(`Tab ${tabId} properties updated`);
    
    if (url) {
      console.log(`Current URL: ${url}`);
      this.categorizeTab(url);
    }
    
    console.log(`Active: ${isActive ? 'Yes' : 'No'}`);
    console.log(`Pinned: ${isPinned ? 'Yes' : 'No'}`);
  }
  
  private categorizeTab(url: string) {
    // Categorize the tab based on the URL
  }
}
```

### zoomChangeInfo

Used with `onTabZoomChange` to extract properties from the zoom change info object:

```typescript
import { onTabZoomChange, zoomChangeInfo, InjectableService } from 'deco-ext';

@InjectableService()
class ZoomTracker {
  @onTabZoomChange()
  logZoomChanges(
    @zoomChangeInfo('tabId') tabId: number,
    @zoomChangeInfo('oldZoomFactor') oldZoom: number,
    @zoomChangeInfo('newZoomFactor') newZoom: number,
    @zoomChangeInfo('zoomSettings') settings: browser.Tabs.ZoomSettings
  ) {
    const changePercentage = Math.round((newZoom / oldZoom - 1) * 100);
    console.log(`Tab ${tabId} zoom ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage)}%`);
    console.log(`Zoom settings: ${settings.mode} (${settings.scope})`);
  }
}
```

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a tab event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 