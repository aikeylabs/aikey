// IndexedDB storage service for AiKey

import type { EncryptedKey, Profile, SiteBinding, UsageLog } from '@/types';

const DB_NAME = 'aikey_vault';
const DB_VERSION = 2;

class StorageService {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Keys store
        if (!db.objectStoreNames.contains('keys')) {
          const keyStore = db.createObjectStore('keys', { keyPath: 'id' });
          keyStore.createIndex('profileId', 'profileId', { unique: false });
          keyStore.createIndex('service', 'service', { unique: false });
          keyStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
          profileStore.createIndex('name', 'name', { unique: false });
          profileStore.createIndex('isDefault', 'isDefault', { unique: false });
        } else if (oldVersion < 2) {
          // Add isDefault index for existing profiles store
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const profileStore = transaction.objectStore('profiles');
          if (!profileStore.indexNames.contains('isDefault')) {
            profileStore.createIndex('isDefault', 'isDefault', { unique: false });
          }
        }

        // Bindings store
        if (!db.objectStoreNames.contains('bindings')) {
          const bindingStore = db.createObjectStore('bindings', { keyPath: 'id' });
          bindingStore.createIndex('domain', 'domain', { unique: false });
          bindingStore.createIndex('profileId', 'profileId', { unique: false });
          bindingStore.createIndex('keyId', 'keyId', { unique: false });
        }

        // Usage logs store
        if (!db.objectStoreNames.contains('usageLogs')) {
          const logStore = db.createObjectStore('usageLogs', { keyPath: 'id' });
          logStore.createIndex('keyId', 'keyId', { unique: false });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('profileId', 'profileId', { unique: false });
        } else if (oldVersion < 2) {
          // Add profileId index for existing usageLogs store
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const logStore = transaction.objectStore('usageLogs');
          if (!logStore.indexNames.contains('profileId')) {
            logStore.createIndex('profileId', 'profileId', { unique: false });
          }
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Keys operations
  async addKey(key: EncryptedKey): Promise<void> {
    return this.performTransaction('keys', 'readwrite', (store) => {
      store.add(key);
    });
  }

  async updateKey(key: EncryptedKey): Promise<void> {
    return this.performTransaction('keys', 'readwrite', (store) => {
      store.put(key);
    });
  }

  async deleteKey(keyId: string): Promise<void> {
    return this.performTransaction('keys', 'readwrite', (store) => {
      store.delete(keyId);
    });
  }

  async getKey(keyId: string): Promise<EncryptedKey | null> {
    return this.performRequest('keys', 'readonly', (store) => {
      return store.get(keyId);
    });
  }

  async getAllKeys(): Promise<EncryptedKey[]> {
    return this.performRequest('keys', 'readonly', (store) => {
      return store.getAll();
    });
  }

  async getKeysByProfile(profileId: string): Promise<EncryptedKey[]> {
    return this.performRequest('keys', 'readonly', (store) => {
      const index = store.index('profileId');
      return index.getAll(profileId);
    });
  }

  // Profile operations
  async addProfile(profile: Profile): Promise<void> {
    return this.performTransaction('profiles', 'readwrite', (store) => {
      store.add(profile);
    });
  }

  async updateProfile(profile: Profile): Promise<void> {
    return this.performTransaction('profiles', 'readwrite', (store) => {
      store.put(profile);
    });
  }

  async deleteProfile(profileId: string): Promise<void> {
    return this.performTransaction('profiles', 'readwrite', (store) => {
      store.delete(profileId);
    });
  }

  async getProfile(profileId: string): Promise<Profile | null> {
    return this.performRequest('profiles', 'readonly', (store) => {
      return store.get(profileId);
    });
  }

  async getAllProfiles(): Promise<Profile[]> {
    return this.performRequest('profiles', 'readonly', (store) => {
      return store.getAll();
    });
  }

  // Site binding operations
  async addBinding(binding: SiteBinding): Promise<void> {
    return this.performTransaction('bindings', 'readwrite', (store) => {
      store.add(binding);
    });
  }

  async deleteBinding(bindingId: string): Promise<void> {
    return this.performTransaction('bindings', 'readwrite', (store) => {
      store.delete(bindingId);
    });
  }

  async getBindingsByDomain(domain: string, profileId: string): Promise<SiteBinding[]> {
    return this.performRequest('bindings', 'readonly', (store) => {
      return store.getAll();
    }).then((bindings) =>
      bindings.filter((b) => b.domain === domain && b.profileId === profileId)
    );
  }

  async getBindings(domain: string): Promise<SiteBinding[]> {
    return this.performRequest('bindings', 'readonly', (store) => {
      return store.getAll();
    }).then((bindings) =>
      bindings.filter((b) => b.domain === domain)
    );
  }

  async getAllBindings(): Promise<SiteBinding[]> {
    return this.performRequest('bindings', 'readonly', (store) => {
      return store.getAll();
    });
  }

  // Usage log operations
  async addUsageLog(log: UsageLog): Promise<void> {
    return this.performTransaction('usageLogs', 'readwrite', (store) => {
      store.add(log);
    });
  }

  async getUsageLogs(keyId?: string): Promise<UsageLog[]> {
    return this.performRequest('usageLogs', 'readonly', (store) => {
      if (keyId) {
        const index = store.index('keyId');
        return index.getAll(keyId);
      }
      return store.getAll();
    });
  }

  async deleteOldLogs(beforeTimestamp: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction('usageLogs', 'readwrite');
    const store = transaction.objectStore('usageLogs');
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(beforeTimestamp);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // No more entries, resolve
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    return this.performTransaction('metadata', 'readwrite', (store) => {
      store.put({ key, value });
    });
  }

  async getMetadata(key: string): Promise<any> {
    const result = await this.performRequest('metadata', 'readonly', (store) => {
      return store.get(key);
    });
    return result?.value;
  }

  // Helper methods
  private performTransaction(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      callback(store);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private performRequest<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Reset the service (for testing purposes)
  reset(): void {
    this.db = null;
  }
}

export const storageService = new StorageService();
export { StorageService };
