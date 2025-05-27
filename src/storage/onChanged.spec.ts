import browser from 'webextension-polyfill';
import container from '~/injectablesContainer'; // Corrected import for default export
import { resolve } from '~/instanceResolver';
import { InjectableService } from '~/service';
import { onStorageChanged, storageAreaName, storageChanges, storageItemChange } from './index';
import { vi } from 'vitest'; // Import vi for Vitest's mocking API

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => {
  // Define a more complete mock for the 'browser' object
  const mockBrowser = {
    storage: {
      onChanged: {
        addListener: vi.fn(),
      },
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      session: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      managed: {
        get: vi.fn(),
      }
    },
    // REMOVED EXTRA CLOSING BRACE HERE
    runtime: {
      // Mock runtime properties if needed by other parts of the codebase indirectly
      id: 'test-extension-id',
      getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
      // ... other runtime mocks if necessary
    },
    // Add other top-level browser APIs if needed by the code under test
    // For now, ensuring storage and runtime are well-defined is key.
  };
  return { default: mockBrowser }; // For ES Modules, the mock often needs to be under a 'default' key
});

describe('Storage Decorators', () => {
  let storageChangedListener: (changes: { [key: string]: browser.storage.StorageChange }, areaName: browser.storage.AreaName) => void;

  beforeEach(() => {
    // Capture the listener
    // After mocking, browser.storage.onChanged.addListener should be the mock function.
    (browser.storage.onChanged.addListener as ReturnType<typeof vi.fn>).mockImplementation((callback: any) => { // Added :any to callback
      storageChangedListener = callback;
    });
  });

  afterEach(() => {
    vi.clearAllMocks(); // Use vi.clearAllMocks with Vitest
    // container.clear(); // Temporarily comment this out // Reset DI container
  });

  describe('@onStorageChanged Core Functionality', () => {
    it('Test 1: Basic invocation with specific key', () => {
      const mockMethod = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        handleStorageChange() {
          mockMethod();
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService); // Registration should be handled by @InjectableService
      resolve(TestService); // Triggers initialListener setup via decorator

      const changes = { testKey: { oldValue: 1, newValue: 2 } };
      storageChangedListener(changes, 'local');
      expect(mockMethod).toHaveBeenCalled();
    });

    it('Test 2: storageArea mismatch', () => {
      const mockMethod = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        handleStorageChange() {
          mockMethod();
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      const changes = { testKey: { oldValue: 1, newValue: 2 } };
      storageChangedListener(changes, 'sync'); // Different area
      expect(mockMethod).not.toHaveBeenCalled();
    });

    it('Test 3: key mismatch', () => {
      const mockMethod = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        handleStorageChange() {
          mockMethod();
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      const changes = { otherKey: { oldValue: 1, newValue: 2 } }; // Different key
      storageChangedListener(changes, 'local');
      expect(mockMethod).not.toHaveBeenCalled();
    });

    it('Test 4: No specific key in decorator options', () => {
      const mockMethod = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local' }) // No specific key
        handleStorageChange() {
          mockMethod();
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      const changes = { anyKey: { oldValue: 1, newValue: 2 } };
      storageChangedListener(changes, 'local');
      expect(mockMethod).toHaveBeenCalled();
    });
    
    it('Test 5: Multiple listeners', () => {
      const mockMethodA = vi.fn(); // Changed to vi.fn()
      const mockMethodB = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local', key: 'keyA' })
        handleA() {
          mockMethodA();
        }

        @onStorageChanged({ storageArea: 'local', key: 'keyB' })
        handleB() {
          mockMethodB();
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      // Trigger for keyA
      storageChangedListener({ keyA: { oldValue: 1, newValue: 2 } }, 'local');
      expect(mockMethodA).toHaveBeenCalledTimes(1);
      expect(mockMethodB).not.toHaveBeenCalled();

      // Trigger for keyB
      storageChangedListener({ keyB: { oldValue: 'x', newValue: 'y' } }, 'local');
      expect(mockMethodA).toHaveBeenCalledTimes(1); // Still 1
      expect(mockMethodB).toHaveBeenCalledTimes(1);
    });
  });

  describe('Parameter Decorators', () => {
    const mockChangesPayload = { itemKey: { oldValue: 'a', newValue: 'b' }, anotherKey: { oldValue: 1, newValue: 2 } };
    const areaNamePayload = 'sync' as browser.storage.AreaName;

    it('Test 6: @StorageChanges() decorator', () => {
      console.log('[DEBUG] storageChanges decorator function type:', typeof storageChanges);
      console.log('[DEBUG] storageChanges itself:', storageChanges ? storageChanges.toString().slice(0, 100) + "..." : "undefined");
      const capturedArgs = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: 'itemKey' })
        handleStorageChange(
          @storageChanges() changesParam: any,
        ) {
          capturedArgs({ changesParam });
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      storageChangedListener(mockChangesPayload, areaNamePayload);
      expect(capturedArgs).toHaveBeenCalledWith({ changesParam: mockChangesPayload });
    });

    it('Test 7: @StorageAreaName() decorator', () => {
      const capturedArgs = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: 'itemKey' })
        handleStorageChange(
          @storageAreaName() areaParam: string,
        ) {
          capturedArgs({ areaParam });
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);
      
      storageChangedListener(mockChangesPayload, areaNamePayload);
      expect(capturedArgs).toHaveBeenCalledWith({ areaParam: areaNamePayload });
    });

    it('Test 8: @StorageItemChange() decorator (with key in onStorageChanged)', () => {
      const capturedArgs = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: 'itemKey' })
        handleStorageChange(
          @storageItemChange() itemChangeParam: browser.storage.StorageChange,
        ) {
          capturedArgs({ itemChangeParam });
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      const specificChanges = { itemKey: { oldValue: 'a', newValue: 'b' } };
      storageChangedListener(specificChanges, areaNamePayload);
      expect(capturedArgs).toHaveBeenCalledWith({ itemChangeParam: specificChanges.itemKey });
    });

    it('Test 9: @StorageItemChange() decorator (no key in onStorageChanged)', () => {
      const capturedArgs = vi.fn(); // Changed to vi.fn()
      const localArea = 'local' as browser.storage.AreaName;

      @InjectableService()
      class TestService {
        // No specific key for onStorageChanged
        @onStorageChanged({ storageArea: localArea }) 
        handleStorageChange(
          @storageItemChange() itemChangeParam: browser.storage.StorageChange | undefined,
          @storageChanges() allChanges: any, // Added to ensure method is called
          @storageAreaName() area: string
        ) {
          capturedArgs({ itemChangeParam, allChanges, area });
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      const changes = { anyKey: { oldValue: 1, newValue: 2 } };
      storageChangedListener(changes, localArea);
      // When no key is specified in @onStorageChanged, specificChange in payloadForHandler is undefined.
      // The createDecorator for StorageItemChange should then return undefined.
      expect(capturedArgs).toHaveBeenCalledWith(
        expect.objectContaining({ 
          itemChangeParam: undefined, // This is the key assertion
          allChanges: changes,
          area: localArea
        })
      );
    });

    it('Test 10: All parameter decorators used together', () => {
      const capturedArgs = vi.fn(); // Changed to vi.fn()
      const specificKey = 'itemKey';

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: specificKey })
        handleStorageChange(
          @storageChanges() changesParam: any,
          @storageAreaName() areaParam: string,
          @storageItemChange() itemChangeParam: browser.storage.StorageChange,
        ) {
          capturedArgs({ changesParam, areaParam, itemChangeParam });
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // container.register(TestService);
      resolve(TestService);

      storageChangedListener(mockChangesPayload, areaNamePayload);
      expect(capturedArgs).toHaveBeenCalledWith({
        changesParam: mockChangesPayload,
        areaParam: areaNamePayload,
        itemChangeParam: mockChangesPayload[specificKey],
      });
    });
  });

  describe('InjectableService Integration', () => {
    it('should call init on the service when resolved', () => {
      const mockInit = vi.fn(); // Changed to vi.fn()
      @InjectableService()
      class TestService {
        init = mockInit; // Assign mockInit to init property
        
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        someMethod() {} // Decorator needed to trigger listener setup
      }
      // container.register(TestService); // Registration should be handled by @InjectableService
      resolve(TestService); // This should trigger the init
      
      expect(mockInit).toHaveBeenCalled();
    });

    it('should not call decorated method if service not registered/resolved', () => {
      // This test is somewhat conceptual as decorators are applied at class definition,
      // but listener registration logic relies on instance resolution.
      const mockMethod = vi.fn(); // Changed to vi.fn()

      @InjectableService()
      class UnresolvedService {
        @onStorageChanged({ storageArea: 'local', key: 'unresolvedKey' })
        handle() {
          mockMethod();
        }
        init = vi.fn(); // Changed to vi.fn()
      }
      // DO NOT register or resolve UnresolvedService with the container

      // Attempt to trigger listener - it shouldn't have been set up for UnresolvedService
      if (storageChangedListener) { // Listener might not even be defined if no services resolved
         storageChangedListener({ unresolvedKey: { oldValue: 1, newValue: 2 } }, 'local');
      }
      expect(mockMethod).not.toHaveBeenCalled();
    });
  });
});
