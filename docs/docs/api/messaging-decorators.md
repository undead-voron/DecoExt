---
sidebar_position: 15
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
  @onMessage({ name: 'auth:login' })
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

## Parameter Decorators

### messageData

Used with `onMessage` to extract the data from the message:

```typescript
import { onMessage, messageData, InjectableService } from 'deco-ext';

@InjectableService()
class AuthService {
  @onMessage({ name: 'auth:login' })
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
  @onMessage({ name: 'content:report' })
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

  @onMessage({ name: 'fetch:data' })
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
  @onMessage({ name: 'data:update' })
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