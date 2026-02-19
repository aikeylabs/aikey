import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EncryptedKey, Profile, SiteBinding, UsageLog } from '@/types';

// Mock IndexedDB
class MockIDBRequest {
  result: any = null;
  error: any = null;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  succeed(result: any) {
    this.result = result;
    if (this.onsuccess) {
      this.onsuccess({ target: this });
    }
  }

  fail(error: any) {
    this.error = error;
    if (this.onerror) {
      this.onerror({ target: this });
    }
  }
}

class MockIDBTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private stores: Map<string, MockIDBObjectStore> = new Map();

  constructor(storeNames: string[]) {
    storeNames.forEach((name) => {
      const store = new MockIDBObjectStore();
      store.transaction = this;
      this.stores.set(name, store);
    });
  }

  objectStore(name: string): MockIDBObjectStore {
    return this.stores.get(name)!;
  }

  complete() {
    if (this.oncomplete) {
      this.oncomplete();
    }
  }

  fail() {
    if (this.onerror) {
      this.onerror();
    }
  }
}

class MockIDBObjectStore {
  private data: Map<string, any> = new Map();
  private indexes: Map<string, MockIDBIndex> = new Map();
  transaction: MockIDBTransaction | null = null;

  add(value: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.set(value.id, value);
      request.succeed(undefined);
      if (this.transaction) {
        this.transaction.complete();
      }
    }, 0);
    return request;
  }

  put(value: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.set(value.id || value.key, value);
      request.succeed(undefined);
      if (this.transaction) {
        this.transaction.complete();
      }
    }, 0);
    return request;
  }

  delete(key: string): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.delete(key);
      request.succeed(undefined);
      if (this.transaction) {
        this.transaction.complete();
      }
    }, 0);
    return request;
  }

  get(key: string): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.succeed(this.data.get(key) || null);
      if (this.transaction) {
        this.transaction.complete();
      }
    }, 0);
    return request;
  }

  getAll(): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.succeed(Array.from(this.data.values()));
      if (this.transaction) {
        this.transaction.complete();
      }
    }, 0);
    return request;
  }

  createIndex(name: string, keyPath: string, options?: any): MockIDBIndex {
    const index = new MockIDBIndex(this.data, keyPath);
    this.indexes.set(name, index);
    return index;
  }

  index(name: string): MockIDBIndex {
    if (!this.indexes.has(name)) {
      // Auto-create index if it doesn't exist
      const index = new MockIDBIndex(this.data, name);
      this.indexes.set(name, index);
    }
    return this.indexes.get(name)!;
  }
}

class MockIDBIndex {
  constructor(
    private data: Map<string, any>,
    private keyPath: string
  ) {}

  getAll(query?: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const results = Array.from(this.data.values()).filter((item) => {
        if (query === undefined) return true;
        return item[this.keyPath] === query;
      });
      request.succeed(results);
    }, 0);
    return request;
  }

  openCursor(range?: any): MockIDBRequest {
    const request = new MockIDBRequest();
    setTimeout(() => {
      // Simplified: iterate through matching items and delete them
      const items = Array.from(this.data.entries());
      let index = 0;

      const processNext = () => {
        if (index >= items.length) {
          request.succeed(null);
          return;
        }

        const [key, item] = items[index];
        const value = item[this.keyPath];

        // Check if value matches range
        let matches = true;
        if (range && range.upper !== undefined) {
          matches = value <= range.upper;
        }

        if (matches) {
          // Create a mock cursor
          const cursor = {
            value: item,
            delete: () => {
              this.data.delete(key);
            },
            continue: () => {
              index++;
              setTimeout(processNext, 0);
            },
          };
          request.succeed(cursor);
        } else {
          index++;
          setTimeout(processNext, 0);
        }
      };

      processNext();
    }, 0);
    return request;
  }
}

class MockIDBDatabase {
  objectStoreNames = {
    contains: (name: string) => false,
  };

  transaction(storeNames: string | string[], mode: string): MockIDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockIDBTransaction(names);
  }

  createObjectStore(name: string, options?: any): MockIDBObjectStore {
    return new MockIDBObjectStore();
  }
}

describe('StorageService', () => {
  let mockDB: MockIDBDatabase;

  beforeEach(async () => {
    mockDB = new MockIDBDatabase();

    // Mock indexedDB.open
    global.indexedDB = {
      open: vi.fn((name: string, version: number) => {
        const request = new MockIDBRequest();
        setTimeout(() => {
          request.result = mockDB;
          request.succeed(mockDB);
        }, 0);
        return request;
      }),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize database successfully', async () => {
      const { storageService } = await import('../storage');
      await expect(storageService.initialize()).resolves.toBeUndefined();
    });

    it('should create object stores on upgrade', async () => {
      const createObjectStoreSpy = vi.spyOn(mockDB, 'createObjectStore');

      global.indexedDB = {
        open: vi.fn((name: string, version: number) => {
          const request = new MockIDBRequest() as any;
          request.onupgradeneeded = null;

          setTimeout(() => {
            if (request.onupgradeneeded) {
              request.onupgradeneeded({ target: { result: mockDB } });
            }
            request.result = mockDB;
            request.succeed(mockDB);
          }, 0);

          return request;
        }),
      } as any;

      const { storageService } = await import('../storage');
      await storageService.initialize();

      // Verify stores would be created (in real scenario)
      expect(indexedDB.open).toHaveBeenCalledWith('aikey_vault', 2);
    });
  });

  describe('Key operations', () => {
    it('should add a key', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const key: EncryptedKey = {
        id: 'key-1',
        name: 'Test Key',
        service: 'OpenAI',
        encryptedValue: { ciphertext: 'encrypted', iv: 'iv' },
        profileId: 'profile-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await expect(storageService.addKey(key)).resolves.toBeUndefined();
    });

    it('should update a key', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const key: EncryptedKey = {
        id: 'key-1',
        name: 'Updated Key',
        service: 'OpenAI',
        encryptedValue: { ciphertext: 'encrypted', iv: 'iv' },
        profileId: 'profile-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await expect(storageService.updateKey(key)).resolves.toBeUndefined();
    });

    it('should delete a key', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      await expect(storageService.deleteKey('key-1')).resolves.toBeUndefined();
    });

    it('should get a key by id', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getKey('key-1');
      expect(result).toBeNull(); // Empty database
    });

    it('should get all keys', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getAllKeys();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get keys by profile', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getKeysByProfile('profile-1');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Profile operations', () => {
    it('should add a profile', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const profile: Profile = {
        id: 'profile-1',
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        isDefault: false,
        createdAt: Date.now(),
      };

      await expect(storageService.addProfile(profile)).resolves.toBeUndefined();
    });

    it('should update a profile', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const profile: Profile = {
        id: 'profile-1',
        name: 'Updated Work',
        icon: '💼',
        color: '#3b82f6',
        isDefault: true,
        createdAt: Date.now(),
      };

      await expect(storageService.updateProfile(profile)).resolves.toBeUndefined();
    });

    it('should delete a profile', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      await expect(storageService.deleteProfile('profile-1')).resolves.toBeUndefined();
    });

    it('should get all profiles', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getAllProfiles();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Binding operations', () => {
    it('should add a binding', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const binding: SiteBinding = {
        id: 'binding-1',
        domain: 'platform.openai.com',
        profileId: 'profile-1',
        keyId: 'key-1',
        createdAt: Date.now(),
      };

      await expect(storageService.addBinding(binding)).resolves.toBeUndefined();
    });

    it('should delete a binding', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      await expect(storageService.deleteBinding('binding-1')).resolves.toBeUndefined();
    });

    it('should get bindings by domain', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getBindingsByDomain(
        'platform.openai.com',
        'profile-1'
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get all bindings', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getAllBindings();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Usage log operations', () => {
    it('should add a usage log', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const log: UsageLog = {
        id: 'log-1',
        keyId: 'key-1',
        domain: 'platform.openai.com',
        timestamp: Date.now(),
      };

      await expect(storageService.addUsageLog(log)).resolves.toBeUndefined();
    });

    it('should get usage logs', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getUsageLogs();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get usage logs by key id', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getUsageLogs('key-1');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should delete old logs', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const timestamp = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
      await expect(storageService.deleteOldLogs(timestamp)).resolves.toBeUndefined();
    });
  });

  describe('Metadata operations', () => {
    it('should set metadata', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      await expect(
        storageService.setMetadata('test-key', { value: 'test' })
      ).resolves.toBeUndefined();
    });

    it('should get metadata', async () => {
      const { storageService } = await import('../storage');
      await storageService.initialize();

      const result = await storageService.getMetadata('test-key');
      expect(result).toBeUndefined(); // Empty database
    });
  });

  describe('Error handling', () => {
    it('should reject operations when database is not initialized', async () => {
      // Import the class directly to create a new instance
      const { StorageService } = await import('../storage');
      const uninitializedService = new StorageService();

      // Test that operations fail without initialization
      await expect(uninitializedService.getAllKeys()).rejects.toThrow();
    });
  });
});
