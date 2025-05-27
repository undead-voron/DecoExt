import browser from 'webextension-polyfill';
import { container } from '~/injectablesContainer';
import { resolve } from '~/instanceResolver';
import { InjectableService } from '~/service';
import { onStorageChanged, StorageAreaName, StorageChanges, StorageItemChange } from './index';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  storage: {
    onChanged: {
      addListener: jest.fn(),
    },
    // Mock other storage areas if directly used by tests, though not typical for onChanged
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    session: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    managed: {
      get: jest.fn(),
    }
  },
  runtime: {
    // Mock runtime properties if needed by other parts of the codebase indirectly
    id: 'test-extension-id',
    getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
    // ... other runtime mocks if necessary
  },
  // ... other browser API mocks if necessary
}));

describe('Storage Decorators', () => {
  let storageChangedListener: (changes: { [key: string]: browser.storage.StorageChange }, areaName: browser.storage.AreaName) => void;

  beforeEach(() => {
    // Capture the listener
    (browser.storage.onChanged.addListener as jest.Mock).mockImplementation((callback) => {
      storageChangedListener = callback;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    container.clear(); // Reset DI container
  });

  describe('@onStorageChanged Core Functionality', () => {
    it('Test 1: Basic invocation with specific key', () => {
      const mockMethod = jest.fn();

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        handleStorageChange() {
          mockMethod();
        }
        init = jest.fn();
      }
      container.register(TestService);
      resolve(TestService); // Triggers initialListener setup via decorator

      const changes = { testKey: { oldValue: 1, newValue: 2 } };
      storageChangedListener(changes, 'local');
      expect(mockMethod).toHaveBeenCalled();
    });

    it('Test 2: storageArea mismatch', () => {
      const mockMethod = jest.fn();

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        handleStorageChange() {
          mockMethod();
        }
        init = jest.fn();
      }
      container.register(TestService);
      resolve(TestService);

      const changes = { testKey: { oldValue: 1, newValue: 2 } };
      storageChangedListener(changes, 'sync'); // Different area
      expect(mockMethod).not.toHaveBeenCalled();
    });

    it('Test 3: key mismatch', () => {
      const mockMethod = jest.fn();

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        handleStorageChange() {
          mockMethod();
        }
        init = jest.fn();
      }
      container.register(TestService);
      resolve(TestService);

      const changes = { otherKey: { oldValue: 1, newValue: 2 } }; // Different key
      storageChangedListener(changes, 'local');
      expect(mockMethod).not.toHaveBeenCalled();
    });

    it('Test 4: No specific key in decorator options', () => {
      const mockMethod = jest.fn();

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: 'local' }) // No specific key
        handleStorageChange() {
          mockMethod();
        }
        init = jest.fn();
      }
      container.register(TestService);
      resolve(TestService);

      const changes = { anyKey: { oldValue: 1, newValue: 2 } };
      storageChangedListener(changes, 'local');
      expect(mockMethod).toHaveBeenCalled();
    });
    
    it('Test 5: Multiple listeners', () => {
      const mockMethodA = jest.fn();
      const mockMethodB = jest.fn();

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
        init = jest.fn();
      }
      container.register(TestService);
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
      const capturedArgs = jest.fn();

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: 'itemKey' })
        handleStorageChange(
          @StorageChanges() changesParam: any,
        ) {
          capturedArgs({ changesParam });
        }
        init = jest.fn();
      }
      container.register(TestService);
      resolve(TestService);

      storageChangedListener(mockChangesPayload, areaNamePayload);
      expect(capturedArgs).toHaveBeenCalledWith({ changesParam: mockChangesPayload });
    });

    it('Test 7: @StorageAreaName() decorator', () => {
      const capturedArgs = jest.fn();

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: 'itemKey' })
        handleStorageChange(
          @StorageAreaName() areaParam: string,
        ) {
          capturedArgs({ areaParam });
        }
        init = jest.fn();
      }
      container.register(TestService);
      resolve(TestService);
      
      storageChangedListener(mockChangesPayload, areaNamePayload);
      expect(capturedArgs).toHaveBeenCalledWith({ areaParam: areaNamePayload });
    });

    it('Test 8: @StorageItemChange() decorator (with key in onStorageChanged)', () => {
      const capturedArgs = jest.fn();

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: 'itemKey' })
        handleStorageChange(
          @StorageItemChange() itemChangeParam: browser.storage.StorageChange,
        ) {
          capturedArgs({ itemChangeParam });
        }
        init = jest.fn();
      }
      container.register(TestService);
      resolve(TestService);

      const specificChanges = { itemKey: { oldValue: 'a', newValue: 'b' } };
      storageChangedListener(specificChanges, areaNamePayload);
      expect(capturedArgs).toHaveBeenCalledWith({ itemChangeParam: specificChanges.itemKey });
    });

    it('Test 9: @StorageItemChange() decorator (no key in onStorageChanged)', () => {
      const capturedArgs = jest.fn();
      const localArea = 'local' as browser.storage.AreaName;

      @InjectableService()
      class TestService {
        // No specific key for onStorageChanged
        @onStorageChanged({ storageArea: localArea }) 
        handleStorageChange(
          @StorageItemChange() itemChangeParam: browser.storage.StorageChange | undefined,
          @StorageChanges() allChanges: any, // Added to ensure method is called
          @StorageAreaName() area: string
        ) {
          capturedArgs({ itemChangeParam, allChanges, area });
        }
        init = jest.fn();
      }
      container.register(TestService);
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
      const capturedArgs = jest.fn();
      const specificKey = 'itemKey';

      @InjectableService()
      class TestService {
        @onStorageChanged({ storageArea: areaNamePayload, key: specificKey })
        handleStorageChange(
          @StorageChanges() changesParam: any,
          @StorageAreaName() areaParam: string,
          @StorageItemChange() itemChangeParam: browser.storage.StorageChange,
        ) {
          capturedArgs({ changesParam, areaParam, itemChangeParam });
        }
        init = jest.fn();
      }
      container.register(TestService);
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
      const mockInit = jest.fn();
      @InjectableService()
      class TestService {
        init = mockInit; // Assign mockInit to init property
        
        @onStorageChanged({ storageArea: 'local', key: 'testKey' })
        someMethod() {} // Decorator needed to trigger listener setup
      }
      container.register(TestService);
      resolve(TestService); // This should trigger the init
      
      expect(mockInit).toHaveBeenCalled();
    });

    it('should not call decorated method if service not registered/resolved', () => {
      // This test is somewhat conceptual as decorators are applied at class definition,
      // but listener registration logic relies on instance resolution.
      const mockMethod = jest.fn();

      @InjectableService()
      class UnresolvedService {
        @onStorageChanged({ storageArea: 'local', key: 'unresolvedKey' })
        handle() {
          mockMethod();
        }
        init = jest.fn();
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
```
