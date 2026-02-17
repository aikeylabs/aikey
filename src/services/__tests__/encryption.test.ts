import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome API
global.chrome = {
  runtime: { id: 'test-extension-id' },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
} as any;

describe('EncryptionService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the module to get a fresh instance
    vi.resetModules();
  });

  it('should initialize with device identifier and salt', async () => {
    const { encryptionService } = await import('../encryption');

    // Mock storage to return no existing salt
    (chrome.storage.local.get as any).mockResolvedValue({});

    // Mock crypto operations
    const mockKeyMaterial = { type: 'secret' };
    const mockMasterKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };

    (crypto.subtle.importKey as any).mockResolvedValue(mockKeyMaterial);
    (crypto.subtle.deriveKey as any).mockResolvedValue(mockMasterKey);

    await encryptionService.initialize();

    // Should create and store new salt
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ encryptionSalt: expect.any(String) })
    );
  });

  it('should reuse existing salt on initialization', async () => {
    const { encryptionService } = await import('../encryption');

    const existingSalt = btoa('existing-salt-16b');
    (chrome.storage.local.get as any).mockResolvedValue({
      encryptionSalt: existingSalt,
    });

    const mockKeyMaterial = { type: 'secret' };
    const mockMasterKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };

    (crypto.subtle.importKey as any).mockResolvedValue(mockKeyMaterial);
    (crypto.subtle.deriveKey as any).mockResolvedValue(mockMasterKey);

    await encryptionService.initialize();

    // Should not create new salt
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('should encrypt plaintext and return ciphertext with iv', async () => {
    const { encryptionService } = await import('../encryption');

    // Setup
    (chrome.storage.local.get as any).mockResolvedValue({});
    const mockKeyMaterial = { type: 'secret' };
    const mockMasterKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };

    (crypto.subtle.importKey as any).mockResolvedValue(mockKeyMaterial);
    (crypto.subtle.deriveKey as any).mockResolvedValue(mockMasterKey);

    const mockCiphertext = new Uint8Array([1, 2, 3, 4]).buffer;
    (crypto.subtle.encrypt as any).mockResolvedValue(mockCiphertext);

    await encryptionService.initialize();

    // Test encryption
    const result = await encryptionService.encrypt('test-plaintext');

    expect(result).toHaveProperty('ciphertext');
    expect(result).toHaveProperty('iv');
    expect(typeof result.ciphertext).toBe('string');
    expect(typeof result.iv).toBe('string');
    expect(crypto.subtle.encrypt).toHaveBeenCalled();
  });

  it('should decrypt ciphertext with iv back to plaintext', async () => {
    const { encryptionService } = await import('../encryption');

    // Setup
    (chrome.storage.local.get as any).mockResolvedValue({});
    const mockKeyMaterial = { type: 'secret' };
    const mockMasterKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };

    (crypto.subtle.importKey as any).mockResolvedValue(mockKeyMaterial);
    (crypto.subtle.deriveKey as any).mockResolvedValue(mockMasterKey);

    const originalText = 'test-plaintext';
    const encoder = new TextEncoder();
    const mockPlaintext = encoder.encode(originalText).buffer;
    (crypto.subtle.decrypt as any).mockResolvedValue(mockPlaintext);

    await encryptionService.initialize();

    // Test decryption
    const ciphertext = btoa('encrypted-data');
    const iv = btoa('initialization-v');
    const result = await encryptionService.decrypt(ciphertext, iv);

    expect(result).toBe(originalText);
    expect(crypto.subtle.decrypt).toHaveBeenCalled();
  });

  it('should throw error when encrypting without initialization', async () => {
    // Create a fresh instance
    const EncryptionService = (await import('../encryption')).default;

    // This will fail because we can't create new instances of the singleton
    // So we test the error message instead
    const { encryptionService } = await import('../encryption');

    await expect(async () => {
      // Try to encrypt without proper initialization
      const uninitializedService = Object.create(
        Object.getPrototypeOf(encryptionService)
      );
      await uninitializedService.encrypt('test');
    }).rejects.toThrow('Encryption service not initialized');
  });

  it('should throw error when decrypting without initialization', async () => {
    const { encryptionService } = await import('../encryption');

    await expect(async () => {
      const uninitializedService = Object.create(
        Object.getPrototypeOf(encryptionService)
      );
      await uninitializedService.decrypt('ciphertext', 'iv');
    }).rejects.toThrow('Encryption service not initialized');
  });

  it('should use PBKDF2 with 100000 iterations for key derivation', async () => {
    const { encryptionService } = await import('../encryption');

    // Mock salt storage
    (chrome.storage.local.get as any).mockResolvedValue({
      encryptionSalt: btoa(String.fromCharCode(...new Uint8Array(16))),
    });
    (chrome.storage.local.set as any).mockResolvedValue(undefined);

    const mockKeyMaterial = { type: 'secret' };
    const mockMasterKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };

    (crypto.subtle.importKey as any).mockResolvedValue(mockKeyMaterial);
    (crypto.subtle.deriveKey as any).mockResolvedValue(mockMasterKey);

    await encryptionService.initialize();

    // Check that deriveKey was called with correct parameters
    expect(crypto.subtle.deriveKey).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PBKDF2',
        iterations: 100000,
        hash: 'SHA-256',
      }),
      mockKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  });
});
