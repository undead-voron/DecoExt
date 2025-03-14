---
sidebar_position: 1
---

# Introduction to DecoExt

DecoExt is a library that simplifies working with Chrome Extension APIs by providing TypeScript decorators. These decorators make it easy to respond to browser events and access browser APIs in a clean, declarative way.

## Installation

```bash
npm install deco-ext
```

## Quick Start

```typescript
import { Service } from 'deco-ext';
import { onHistoryVisited, historyItem } from 'deco-ext';

@Service()
class MyHistoryService {
  @onHistoryVisited()
  logPageVisits(@historyItem('url') url: string) {
    console.log(`User visited: ${url}`);
  }
}
```

Check out the API reference for more detailed documentation on each decorator.