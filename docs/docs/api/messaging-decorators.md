---
title: Messaging Decorators
---

# Messaging Decorators

The Messaging system in deco-ext provides a type-safe way to communicate between different parts of your extension. It is inspired by [webext-bridge](https://github.com/antfu/webext-bridge) and offers similar benefits with tight integration with the decorator pattern.

## Type System

### Extending the ProtocolMap

First, extend the `ProtocolMap` interface to define your message types:

```typescript
import { ProtocolMap, ProtocolWithReturn } from 'deco-ext';

declare module 'deco-ext' {
  interface ProtocolMap {
    // Simple message with data but no return type
    'user:settings': { theme: string; notifications: boolean };
    
    // Function-like message with arguments and return type
    'fetch:data': (query: string) => Promise<{ results: any[] }>;
    
    // Message with explicit data and return types
    'auth:login': ProtocolWithReturn<
      { username: string; password: string },
      { success: boolean; token?: string; error?: string }
    >;
  }
}
```

By extending the `ProtocolMap`, you get full type checking for both message data and return values.

## Method Decorators

### onMessage

This decorator allows you to handle messages with a specific name in your service. It can be used in both background and content scripts.

```typescript
import { onMessage, InjectableService } from 'deco-ext';

@InjectableService()
class AuthService {
  @onMessage({ key: 'auth:login' })
  handleLogin(arg: { 
    data: { username: string; password: string }, 
    sender: browser.Runtime.MessageSender 
  }) {
    console.log(`Login attempt from ${arg.data.username}`);
    
    // Authenticate user
    if (arg.data.username === 'admin' && arg.data.password === 'password') {
      return { success: true, token: 'fake-jwt-token' };
    } else {
      return { success: false, error: 'Invalid credentials' };
    }
  }
}
```

## Filtering Events

All messaging decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives a single argument object containing `{ data: any, sender: browser.Runtime.MessageSender }` and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Examples

```typescript
import { onMessage, InjectableService } from 'deco-ext';

@InjectableService()
class MessageFilterService {
  // Only handle messages of specific types
  @onMessage({ 
    key: 'system:event',
    filter: (arg) => arg.data.type === 'userAction' || arg.data.type === 'systemEvent'
  })
  handleImportantMessages(arg: { data: any, sender: browser.Runtime.MessageSender }) {
    console.log(`Important message: ${arg.data.type}`);
    this.processImportantMessage(arg.data);
  }

  // Only handle messages from content scripts
  @onMessage({ 
    key: 'content:message',
    filter: (arg) => arg.sender.tab !== undefined 
  })
  handleContentScriptMessages(arg: { data: any, sender: browser.Runtime.MessageSender }) {
    console.log(`Message from tab ${arg.sender.tab?.id}: ${arg.data.type}`);
    this.processTabMessage(arg.data, arg.sender.tab!);
  }

  // Only handle messages from specific origins
  @onMessage({ 
    key: 'trusted:site',
    filter: (arg) => {
      const url = arg.sender.tab?.url || arg.sender.url;
      return url?.includes('github.com') || url?.includes('stackoverflow.com');
    }
  })
  handleTrustedSiteMessages(arg: { data: any, sender: browser.Runtime.MessageSender }) {
    console.log('Message from trusted site');
    this.processTrustedMessage(arg.data);
  }

  private processImportantMessage(message: any) {
    // Process important messages
  }

  private processTabMessage(message: any, tab: browser.Tabs.Tab) {
    // Process messages from tabs
  }

  private processTrustedMessage(message: any) {
    // Process messages from trusted sites
  }
}
```

### Advanced Filtering Examples

```typescript
import { onMessage, InjectableService } from 'deco-ext';

// Module-level configuration and tracking (accessible to filters)
const allowedExtensions = new Set(['extension-id-1', 'extension-id-2']);
const rateLimitMap = new Map<string, number[]>();

// Helper functions for message validation
async function validateSender(sender: browser.Runtime.MessageSender): Promise<boolean> {
  // Validate the sender (check permissions, origin, etc.)
  return true; // Example implementation
}

function validateMessageContent(message: any): boolean {
  // Validate message content structure and data
  return typeof message.type === 'string' && message.payload !== null;
}

@InjectableService()
class AdvancedMessageService {
  // Filter messages from specific extensions only
  @onMessage({ 
    key: 'extension:message',
    filter: (arg) => {
      const senderId = arg.sender.id;
      return senderId ? allowedExtensions.has(senderId) : false;
    }
  })
  handleExtensionMessages(arg: { data: any, sender: browser.Runtime.MessageSender }) {
    console.log(`Message from allowed extension: ${arg.sender.id}`);
    this.processExtensionMessage(arg.data, arg.sender);
  }

  // Rate-limited message filtering
  @onMessage({ 
    key: 'rate:limited',
    filter: (arg) => {
      const senderId = arg.sender.id || arg.sender.tab?.id?.toString() || 'unknown';
      const now = Date.now();
      const timeWindow = 60000; // 1 minute
      const maxMessages = 10;
      
      if (!rateLimitMap.has(senderId)) {
        rateLimitMap.set(senderId, []);
      }
      
      const timestamps = rateLimitMap.get(senderId)!;
      // Remove old timestamps
      const recentTimestamps = timestamps.filter(ts => now - ts < timeWindow);
      
      if (recentTimestamps.length >= maxMessages) {
        console.warn(`Rate limit exceeded for sender: ${senderId}`);
        return false;
      }
      
      recentTimestamps.push(now);
      rateLimitMap.set(senderId, recentTimestamps);
      return true;
    }
  })
  handleRateLimitedMessages(arg: { data: any, sender: browser.Runtime.MessageSender }) {
    console.log('Processing rate-limited message');
    this.processMessage(arg.data);
  }

  // Filter based on message content and sender validation
  @onMessage({ 
    key: 'validated:message',
    filter: async (arg) => {
      // Validate message structure
      if (!arg.data.type || !arg.data.payload) return false;
      
      // Additional async validation
      const isValidSender = await validateSender(arg.sender);
      const isValidMessage = validateMessageContent(arg.data);
      
      return isValidSender && isValidMessage;
    }
  })
  handleValidatedMessages(arg: { data: any, sender: browser.Runtime.MessageSender }) {
    console.log('Processing validated message');
    this.processValidatedMessage(arg.data, arg.sender);
  }

  private processExtensionMessage(message: any, sender: browser.Runtime.MessageSender) {
    // Process messages from allowed extensions
  }

  private processMessage(message: any) {
    // Process rate-limited messages
  }

  private processValidatedMessage(message: any, sender: browser.Runtime.MessageSender) {
    // Process fully validated messages
  }
}
```

### Filter with Parameter Decorators

```typescript
import { onMessage, messageData, messageSender, InjectableService } from 'deco-ext';

@InjectableService()
class MessageTrackingService {
  @onMessage({ 
    key: 'analytics:track',
    filter: (arg) => arg.data.type === 'analytics' && arg.sender.tab !== undefined
  })
  trackAnalyticsMessages(
    @messageData('payload') payload: any,
    @messageSender('tab') tab: browser.Tabs.Tab | undefined
  ) {
    if (tab && payload) {
      console.log(`Analytics from tab ${tab.id}: ${JSON.stringify(payload)}`);
      this.recordAnalytics(payload, tab);
    }
  }

  private recordAnalytics(payload: any, tab: browser.Tabs.Tab) {
    // Record analytics data
  }
}
```

## Parameter Decorators

### messageData

Used with `onMessage` to extract the data from the message:

```typescript
import { onMessage, messageData, InjectableService } from 'deco-ext';

@InjectableService()
class AuthService {
  @onMessage({ key: 'auth:login' })
  handleLogin(
    @messageData() credentials: { username: string; password: string },
    @messageData('username') username: string
  ) {
    console.log(`Login attempt from ${username}`);
    
    // Access full credentials object or specific properties
    if (credentials.username === 'admin' && credentials.password === 'password') {
      return { success: true, token: 'fake-jwt-token' };
    } else {
      return { success: false, error: 'Invalid credentials' };
    }
  }
}
```

### messageSender

Used with `onMessage` to extract sender information:

```typescript
import { onMessage, messageData, messageSender, InjectableService } from 'deco-ext';

@InjectableService()
class ContentScriptCommunicator {
  @onMessage({ key: 'content:report' })
  handleContentReport(
    @messageData() data: { url: string; content: string },
    @messageSender() sender: browser.Runtime.MessageSender,
    @messageSender('tab') tab: browser.Tabs.Tab | undefined,
    @messageSender('id') extensionId: string
  ) {
    console.log(`Message from tab ${tab?.id} at URL ${data.url}`);
    console.log(`Extension ID: ${extensionId}`);
    
    // Process content report
    return { received: true, timestamp: Date.now() };
  }
}
```

## Sending Messages

### sendMessageToBackground

Send messages from content scripts, popup, options pages, or other non-background contexts to the background script:

```typescript
import { sendMessageToBackground } from 'deco-ext';

// Send a simple message
const response = await sendMessageToBackground('user:settings', { 
  theme: 'dark', 
  notifications: true 
});
// Response is typed based on the ProtocolMap

// Send a login request
const loginResult = await sendMessageToBackground('auth:login', {
  username: 'admin',
  password: 'password'
});
// loginResult is typed as { success: boolean; token?: string; error?: string }
```

### sendMessageToContent

Send messages from the background script to content scripts:

```typescript
import { sendMessageToContent } from 'deco-ext';

// Get the active tab ID
const tabs = await browser.tabs.query({ active: true, currentWindow: true });
const tabId = tabs[0].id;

// Send message to the content script in that tab
const response = await sendMessageToContent('content:update', {
  action: 'highlight',
  selector: '.important'
}, { tabId });
```

> **Important**: `sendMessageToContent` should only be used in background scripts, as only they have the necessary permissions to send messages to specific tabs.

> **Important**: `sendMessageToBackground` should never be used in background scripts themselves. It's intended for use in content scripts, popup pages, options pages, etc.

## Complete Example

Here's a complete example showing bi-directional communication:

Background Script:
```typescript
import { onMessage, messageData, InjectableService, sendMessageToContent } from 'deco-ext';

@InjectableService()
class DataService {
  private cache = new Map<string, any>();

  @onMessage({ key: 'fetch:data' })
  async handleFetchData(@messageData() query: string) {
    console.log(`Fetching data for query: ${query}`);
    
    // Check cache first
    if (this.cache.has(query)) {
      return { results: this.cache.get(query) };
    }
    
    // Simulate API call
    const results = await this.fetchFromApi(query);
    this.cache.set(query, results);
    
    return { results };
  }
  
  private async fetchFromApi(query: string) {
    // Simulate API request
    return [{ id: 1, name: 'Result 1' }, { id: 2, name: 'Result 2' }];
  }
  
  async sendUpdateToAllTabs(update: any) {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        sendMessageToContent('data:update', { update }, { tabId: tab.id });
      }
    }
  }
}
```

Content Script:
```typescript
import { onMessage, messageData, sendMessageToBackground, InjectableService } from 'deco-ext';

@InjectableService()
class ContentApp {
  @onMessage({ key: 'data:update' })
  handleDataUpdate(@messageData('update') update: any) {
    console.log('Received data update:', update);
    // Update UI with new data
    this.updateUI(update);
  }
  
  private updateUI(data: any) {
    // Update the page DOM
    document.getElementById('data-container')!.textContent = JSON.stringify(data);
  }
  
  async searchData(query: string) {
    const result = await sendMessageToBackground('fetch:data', query);
    this.updateUI(result.results);
    return result;
  }
}
```

## Implementation Details

The messaging system uses a singleton pattern to ensure only one message listener is registered, and then routes messages to the appropriate handlers based on the message name. When a message is received:

1. The message is checked for a valid `name` property
2. If a handler is registered for that name, it's called with the message data and sender
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the message
   - If parameter decorators are used, the message data and sender are transformed accordingly
   - The method is called with the appropriate parameters
   - The return value is passed back as the response to the message

The messaging decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 