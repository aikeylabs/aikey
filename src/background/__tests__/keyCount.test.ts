import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageType } from '../../types/messages';

// Mock chrome API
const mockStorage = new Map();
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        const result: any = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = mockStorage.get(key);
          });
        } else if (typeof keys === 'string') {
          result[keys] = mockStorage.get(keys);
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items) => {
        Object.entries(items).forEach(([key, value]) => {
          mockStorage.set(key, value);
        });
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => mockStorage.delete(key));
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    id: 'test-extension-id',
    onMessage: {
      addListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    onStartup: {
      addListener: vi.fn(),
    },
  },
} as any;

// Mock crypto.subtle for encryption service
if (!global.crypto) {
  global.crypto = {} as any;
}

// Mock crypto.getRandomValues first
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = vi.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  });
}

// Mock crypto.randomUUID
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = vi.fn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  });
}

// Mock crypto.subtle with proper Web Crypto API implementation
const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };

global.crypto.subtle = {
  importKey: vi.fn().mockImplementation(async (...args) => {
    return mockKey;
  }),
  deriveKey: vi.fn().mockImplementation(async (...args) => {
    return mockKey;
  }),
  encrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
    // Return encrypted data with proper structure
    const encrypted = new Uint8Array(data);
    return encrypted.buffer;
  }),
  decrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
    // Return decrypted data
    const decrypted = new Uint8Array(data);
    return decrypted.buffer;
  }),
} as any;

describe('KeyCount Integration Tests', () => {
  let handleMessage: any;
  let initializeExtension: any;
  let resetServices: any;

  beforeAll(async () => {
    // Reset modules once before all tests
    vi.resetModules();

    // Import modules
    const imported = await import('../index');
    handleMessage = imported.handleMessage;
    initializeExtension = imported.initializeExtension;
    resetServices = imported.resetServices;

    // Initialize services once
    await initializeExtension();

    // Wait for async initialization to complete
    await new Promise(resolve => setTimeout(resolve, 150));
  });

  beforeEach(async () => {
    mockStorage.clear();
    vi.clearAllMocks();

    // Reset and re-initialize services after clearing storage
    resetServices();
    await initializeExtension();
    await new Promise(resolve => setTimeout(resolve, 150));
  });

  it('should update keyCount when adding a key', async () => {
    // Create a profile
    const createProfileResponse = await handleMessage({
      type: MessageType.CREATE_PROFILE,
      payload: { name: 'Test Profile', description: 'Test', color: '#FF5733', icon: 'user' },
    });

    expect(createProfileResponse.success).toBe(true);
    const profileId = createProfileResponse.data.id;

    // Set as current profile
    await handleMessage({
      type: MessageType.SWITCH_PROFILE,
      payload: { profileId },
    });

    // Add a key
    const addKeyResponse = await handleMessage({
      type: MessageType.ADD_KEY,
      payload: {
        service: 'OpenAI',
        apiKey: 'sk-test123',
        name: 'Test Key',
      },
    });

    if (!addKeyResponse.success) {
      console.error('Add key failed:', addKeyResponse.error);
    }
    expect(addKeyResponse.success).toBe(true);

    // Get profile and check keyCount
    const profileResponse = await handleMessage({
      type: MessageType.GET_CURRENT_PROFILE,
      payload: {},
    });

    expect(profileResponse.data.metadata.keyCount).toBe(1);

    // Add another key
    await handleMessage({
      type: MessageType.ADD_KEY,
      payload: {
        service: 'Anthropic',
        apiKey: 'sk-ant-test456',
        name: 'Test Key 2',
      },
    });

    // Check keyCount again
    const profileResponse2 = await handleMessage({
      type: MessageType.GET_CURRENT_PROFILE,
      payload: {},
    });

    expect(profileResponse2.data.metadata.keyCount).toBe(2);
  });

  it('should update keyCount when deleting a key', async () => {

    // Create profile and add keys
    const createProfileResponse = await handleMessage({
      type: MessageType.CREATE_PROFILE,
      payload: { name: 'Test Profile', description: 'Test', color: '#FF5733', icon: 'user' },
    });

    if (!createProfileResponse.success) {
      console.error('Create profile failed:', createProfileResponse.error);
    }
    expect(createProfileResponse.success).toBe(true);
    const profileId = createProfileResponse.data.id;

    await handleMessage({
      type: MessageType.SWITCH_PROFILE,
      payload: { profileId },
    });

    // Add two keys
    const addKey1Response = await handleMessage({
      type: MessageType.ADD_KEY,
      payload: {
        service: 'openai',
        apiKey: 'sk-test123',
        name: 'Test Key 1',
      },
    });

    await handleMessage({
      type: MessageType.ADD_KEY,
      payload: {
        service: 'anthropic',
        apiKey: 'sk-ant-test456',
        name: 'Test Key 2',
      },
    });

    // Verify keyCount is 2
    let profileResponse = await handleMessage({
      type: MessageType.GET_CURRENT_PROFILE,
      payload: {},
    });
    expect(profileResponse.data.metadata.keyCount).toBe(2);

    // Delete one key
    await handleMessage({
      type: MessageType.DELETE_KEY,
      payload: { keyId: addKey1Response.data.keyId },
    });

    // Verify keyCount is now 1
    profileResponse = await handleMessage({
      type: MessageType.GET_CURRENT_PROFILE,
      payload: {},
    });
    expect(profileResponse.data.metadata.keyCount).toBe(1);
  });
});
