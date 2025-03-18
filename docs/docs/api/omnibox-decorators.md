---
title: Omnibox Decorators
---

# Omnibox Decorators

The Omnibox decorators allow you to easily respond to browser address bar (omnibox) events in your extension services. These decorators provide a clean way to handle user interactions with your extension's keyword in the address bar.

## Method Decorators

### onOmniboxInputStarted

This decorator handles events that fire when the user begins typing in the omnibox with your extension's keyword selected.

```typescript
import { onOmniboxInputStarted, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputStarted()
  handleInputStarted() {
    console.log('User started typing with our keyword');
    this.prepareSearchEnvironment();
  }
  
  private prepareSearchEnvironment() {
    // Prepare any resources needed for search suggestions
  }
}
```

### onOmniboxInputChanged

This decorator handles events that fire when the user types in the omnibox with your extension's keyword selected.

```typescript
import { onOmniboxInputChanged, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputChanged()
  handleInputChanged(arg: { text: string, suggest: (suggestResults: browser.Omnibox.SuggestResult[]) => void }) {
    console.log('User input:', arg.text);
    
    // Generate suggestions based on user input
    const suggestions = this.generateSuggestions(arg.text);
    
    // Send suggestions back to the browser
    arg.suggest(suggestions);
  }
  
  private generateSuggestions(query: string): browser.Omnibox.SuggestResult[] {
    return [
      { content: `search:${query}`, description: `Search for "${query}"` },
      { content: `lucky:${query}`, description: `I'm feeling lucky: "${query}"` },
    ];
  }
}
```

With parameter decorator:

```typescript
import { onOmniboxInputChanged, omniboxInputChangedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputChanged()
  handleInputChanged(
    @omniboxInputChangedDetails('text') text: string,
    @omniboxInputChangedDetails('suggest') suggest: (results: browser.Omnibox.SuggestResult[]) => void
  ) {
    const suggestions = [
      { content: `search:${text}`, description: `Search for "${text}"` },
      { content: `lucky:${text}`, description: `I'm feeling lucky: "${text}"` },
    ];
    
    suggest(suggestions);
  }
}
```

### onOmniboxInputEntered

This decorator handles events that fire when the user accepts a suggestion or submits what they've typed in the omnibox.

```typescript
import { onOmniboxInputEntered, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputEntered()
  handleInputEntered(arg: { text: string, disposition: browser.Omnibox.OnInputEnteredDisposition }) {
    console.log('User entered:', arg.text);
    console.log('Disposition:', arg.disposition);
    
    // Determine what to do based on the input
    if (arg.text.startsWith('search:')) {
      const query = arg.text.substring(7);
      this.performSearch(query, arg.disposition);
    } else if (arg.text.startsWith('lucky:')) {
      const query = arg.text.substring(6);
      this.performLuckySearch(query, arg.disposition);
    }
  }
  
  private performSearch(query: string, disposition: browser.Omnibox.OnInputEnteredDisposition) {
    const url = `https://example.com/search?q=${encodeURIComponent(query)}`;
    this.navigateBasedOnDisposition(url, disposition);
  }
  
  private performLuckySearch(query: string, disposition: browser.Omnibox.OnInputEnteredDisposition) {
    const url = `https://example.com/lucky?q=${encodeURIComponent(query)}`;
    this.navigateBasedOnDisposition(url, disposition);
  }
  
  private navigateBasedOnDisposition(url: string, disposition: browser.Omnibox.OnInputEnteredDisposition) {
    switch (disposition) {
      case 'currentTab':
        browser.tabs.update({ url });
        break;
      case 'newForegroundTab':
        browser.tabs.create({ url, active: true });
        break;
      case 'newBackgroundTab':
        browser.tabs.create({ url, active: false });
        break;
    }
  }
}
```

With parameter decorator:

```typescript
import { onOmniboxInputEntered, omniboxInputEntered, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputEntered()
  handleInputEntered(
    @omniboxInputEntered('text') text: string,
    @omniboxInputEntered('disposition') disposition: browser.Omnibox.OnInputEnteredDisposition
  ) {
    const url = `https://example.com/search?q=${encodeURIComponent(text)}`;
    this.openUrl(url, disposition);
  }
  
  private openUrl(url: string, disposition: browser.Omnibox.OnInputEnteredDisposition) {
    switch (disposition) {
      case 'currentTab':
        browser.tabs.update({ url });
        break;
      case 'newForegroundTab':
        browser.tabs.create({ url, active: true });
        break;
      case 'newBackgroundTab':
        browser.tabs.create({ url, active: false });
        break;
    }
  }
}
```

### onOmniboxInputCancelled

This decorator handles events that fire when the user cancels their input in the omnibox.

```typescript
import { onOmniboxInputCancelled, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputCancelled()
  handleInputCancelled() {
    console.log('User cancelled omnibox input');
    this.cleanupSearchResources();
  }
  
  private cleanupSearchResources() {
    // Clean up any resources that were allocated for search
  }
}
```

### onOmniboxDeleteSuggestion

This decorator handles events that fire when the user deletes a suggestion from the omnibox.

```typescript
import { onOmniboxDeleteSuggestion, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxDeleteSuggestion()
  handleDeleteSuggestion(text: string) {
    console.log('User deleted suggestion:', text);
    this.removeFromHistory(text);
  }
  
  private removeFromHistory(query: string) {
    // Remove the query from search history or suggestion database
  }
}
```

## Parameter Decorators

The Omnibox API provides parameter decorators for events that pass parameters:

### omniboxInputChangedDetails

Used with `onOmniboxInputChanged` to extract specific properties:

```typescript
import { onOmniboxInputChanged, omniboxInputChangedDetails, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputChanged()
  provideSearchSuggestions(
    @omniboxInputChangedDetails('text') userInput: string,
    @omniboxInputChangedDetails('suggest') provideSuggestions: (results: browser.Omnibox.SuggestResult[]) => void
  ) {
    // Generate and provide suggestions based on user input
    const results = this.search(userInput);
    provideSuggestions(results);
  }
  
  private search(query: string): browser.Omnibox.SuggestResult[] {
    // Search implementation
    return [];
  }
}
```

### omniboxInputEntered

Used with `onOmniboxInputEntered` to extract specific properties:

```typescript
import { onOmniboxInputEntered, omniboxInputEntered, InjectableService } from 'deco-ext';

@InjectableService()
class SearchService {
  @onOmniboxInputEntered()
  handleSearchExecution(
    @omniboxInputEntered('text') query: string,
    @omniboxInputEntered('disposition') openBehavior: browser.Omnibox.OnInputEnteredDisposition
  ) {
    // Execute search based on the finalized query
    const searchUrl = `https://example.com/search?q=${encodeURIComponent(query)}`;
    
    // Open the result based on the user's behavior (current tab, new tab, etc.)
    this.openSearchResult(searchUrl, openBehavior);
  }
  
  private openSearchResult(url: string, behavior: browser.Omnibox.OnInputEnteredDisposition) {
    // Implementation for opening the URL based on the disposition
  }
}
```

## Omnibox API Concepts

### Suggest Results

When providing suggestions in the `onOmniboxInputChanged` event, you use the `SuggestResult` format:

```typescript
interface SuggestResult {
  // The text that is put into the URL bar when the user selects this suggestion
  content: string;
  
  // The text shown in the dropdown
  description: string;
  
  // Optional: Whether the suggestion should be accepted when highlighting it with arrow keys
  // (without requiring explicit user selection)
  deletable?: boolean;
}
```

### Disposition Types

The `disposition` parameter in `onOmniboxInputEntered` can be one of:

- `'currentTab'`: Open the result in the current tab
- `'newForegroundTab'`: Open the result in a new tab and switch to it
- `'newBackgroundTab'`: Open the result in a new background tab without switching to it

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When an omnibox event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext.

## Setting Up the Omnibox Keyword

To use the omnibox API, you must specify a keyword in your extension's manifest:

```json
{
  "omnibox": {
    "keyword": "mysearch"
  }
}
```

This allows users to access your extension's functionality by typing "mysearch" followed by a space in the address bar. 