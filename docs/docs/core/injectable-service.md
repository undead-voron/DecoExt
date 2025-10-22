---
sidebar_position: 1
title: Injectable Service Decorator
---

# Injectable Service Decorator

The `InjectableService` decorator is a core component of deco-ext that enables dependency injection and ensures your service classes follow the singleton pattern. Inspired by NestJS, it provides a clean, modular way to organize your extension's business logic.

## Basic Usage

```typescript
import { InjectableService, resolve } from 'deco-ext';

@InjectableService()
class LoggingService {
  log(message: string) {
    console.log(`[LOG]: ${message}`);
  }
}

@InjectableService()
class UserService {
  constructor(private logger: LoggingService) {}
  
  getUserInfo() {
    this.logger.log('Getting user info');
    // Implementation...
    return { name: 'User' };
  }
}

(async () => {
  // Get an instance of the service
  const userService = resolve(UserService);
  await userService.init()
  userService.getUserInfo(); // LoggingService is automatically injected
})()
```

## Dependency Injection

Services declare their dependencies through constructor parameters:

```typescript
import { InjectableService } from 'deco-ext';

@InjectableService()
class DatabaseService {
  async query(sql: string) {
    // Implementation...
  }
}

@InjectableService()
class CacheService {
  // Implementation...
}

@InjectableService()
class UserRepository {
  // Dependencies are automatically injected
  constructor(
    private database: DatabaseService,
    private cache: CacheService
  ) {}
  
  async getUsers() {
    // Implementation using database and cache...
  }
}
```

All dependencies must also be decorated with `@InjectableService()`.

## Singleton Behavior

Each `@InjectableService()` decorated class has exactly one instance throughout your application. When you resolve a service, you always get the same instance:

```typescript
import { InjectableService, resolve } from 'deco-ext';

@InjectableService()
class CounterService {
  private count = 0;
  
  increment() {
    this.count++;
    return this.count;
  }
}

(async () => {
  const counter1 = resolve(CounterService);
  const counter2 = resolve(CounterService);

  await Promise.all([conter1.init(), counter2.init()])

  console.log(counter1.increment()); // 1
  console.log(counter2.increment()); // 2, not 1, because counter1 and counter2 are the same instance
  console.log(counter1 === counter2); // true
})()
```

## Initialization with the `init` Method

A special `init` method can be defined in your service that will be automatically called before any decorated methods are executed. This is useful for performing setup tasks like loading data from storage, making API calls, or other asynchronous operations. Incase you need instance of a service outside decorators, init must be called manually.

```typescript
import { InjectableService, onBrowserStartup, resolve } from 'deco-ext';

@InjectableService()
class SettingsService {
  private settings: any = null;
  
  async init() {
    // Load settings from storage - this will complete before any decorated methods run
    this.settings = await browser.storage.local.get('settings');
    console.log('Settings loaded');
  }
  
  @onBrowserStartup()
  handleStartup() {
    // The init method is guaranteed to have completed before this runs
    console.log('Browser started with settings:', this.settings);
  }
  
  getSettings() {
    return this.settings;
  }
}

(async () => {
  const settingsService = resolve(SettingsService);
  await settingsService.init()
})()

```

The `init` method:

1. Can be asynchronous and return a Promise
2. Will be automatically awaited before any decorated methods are called
3. Will only be called once per service instance
4. Ensures that your service is fully initialized before being used

## Dependency Chain Initialization

When services depend on each other, their `init` methods are called in the correct order:

```typescript
import { InjectableService, resolve } from 'deco-ext';

@InjectableService()
class DatabaseService {
  private db: any = null;
  
  async init() {
    console.log('Connecting to database...');
    // Simulate DB connection
    await new Promise(resolve => setTimeout(resolve, 100));
    this.db = { status: 'connected' };
    console.log('Database connected');
  }
  
  query(sql: string) {
    return this.db.query(sql);
  }
}

@InjectableService()
class UserRepository {
  constructor(private database: DatabaseService) {}
  
  async init() {
    console.log('Initializing user repository...');
    // This will only run after DatabaseService.init() has completed
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('User repository ready');
  }
  
  getUsers() {
    return this.database.query('SELECT * FROM users');
  }
}

(async () => {
  // Resolving and calling init on UserRepository will ensure DatabaseService is initialized first
  const userRepo = resolve(UserRepository);
  await userRepo.init()
  userRepo.getUsers()
})()
```

## Usage with Event Decorators

The `InjectableService` decorator is required for all classes that use deco-ext's event decorators:

```typescript
import { InjectableService, onTabActivated } from 'deco-ext';

@InjectableService()
class TabMonitor {
  private activeTabId: number | null = null;
  
  async init() {
    // Load previously stored active tab ID
    const data = await browser.storage.local.get('activeTabId');
    this.activeTabId = data.activeTabId || null;
    console.log('TabMonitor initialized with tab ID:', this.activeTabId);
  }
  
  @onTabActivated()
  handleTabActivation(activeInfo: browser.Tabs.OnActivatedActiveInfoType) {
    // The init method is completed before this handler runs
    this.activeTabId = activeInfo.tabId;
    browser.storage.local.set({ activeTabId: this.activeTabId });
    console.log('Tab activated:', this.activeTabId);
  }
}

// No need to manually resolve - the TabMonitor will be automatically
// instantiated and initialized when the extension loads
```

## Implementation Notes

- The `InjectableService` decorator must be applied directly to a class, not a method
- TypeScript's experimental decorators feature must be enabled in your tsconfig.json
- Dependencies are resolved recursively, so you don't need to manually manage the initialization order
- All services are lazily instantiated - they're only created when first needed 
