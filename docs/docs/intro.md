---
slug: /
sidebar_position: 1
---

# Introduction to DecoExt

DecoExt is a library that simplifies working with Chrome Extension APIs by providing TypeScript decorators. These decorators make it easy to respond to browser events and access browser APIs in a clean, declarative way.

## Project Setup

Setting up a project with DecoExt requires a few configuration steps to ensure TypeScript decorators work correctly:

### 1. Create a new extension project

Start by creating a new extension project using the vite web extension template:

```bash
npm init @samrum/vite-plugin-web-extension@latest
```

Follow the prompts to configure your extension project.

### 2. Install required dependencies

Install DecoExt and the necessary SWC transformation plugin:

```bash
npm install deco-ext
npm install vite-plugin-swc-transform --save-dev
```

### 3. Configure the SWC plugin

Open your `vite.config.ts` file and add the SWC plugin configuration to enable decorator metadata:

```typescript
import { defineConfig } from 'vite'
import webExtension from '@samrum/vite-plugin-web-extension'
import swc from 'vite-plugin-swc-transform'

// Import your manifest
import manifest from './src/manifest'

export default defineConfig({
  plugins: [
    webExtension({ manifest }),
    swc({
      swcOptions: {
        jsc: {
          target: 'es2022',
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
            useDefineForClassFields: false,
          },
        },
      },
    }),
  ],
})
```

### 4. Configure TypeScript

Ensure your `tsconfig.json` includes the necessary decorator settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Usage Example

Now you can use DecoExt in your extension:

```typescript
import { InjectableService, onHistoryVisited, historyItem } from 'deco-ext';

@InjectableService()
class MyHistoryService {
  @onHistoryVisited()
  logPageVisits(@historyItem('url') url: string) {
    console.log(`User visited: ${url}`);
  }
}
```

This example creates a service that logs each URL the user visits. DecoExt handles all the browser event subscription and dependency injection for you.

Check out the API reference for more detailed documentation on each decorator.