import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock Web Crypto API
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {
      generateKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      deriveBits: vi.fn(),
      deriveKey: vi.fn(),
    },
  },
  writable: true,
});
