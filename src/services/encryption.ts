// Encryption service using Web Crypto API
// Device-bound encryption with AES-256-GCM

class EncryptionService {
  private masterKey: CryptoKey | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const deviceId = await this.getDeviceIdentifier();
      const salt = await this.getOrCreateSalt();
      this.masterKey = await this.deriveKey(deviceId, salt);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw error;
    }
  }

  // Reset the service (for testing purposes)
  reset(): void {
    this.masterKey = null;
    this.initialized = false;
  }

  private async getDeviceIdentifier(): Promise<string> {
    // Use browser fingerprint + extension ID
    const extensionId = chrome.runtime.id;
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    return `${extensionId}-${userAgent}-${language}`;
  }

  private async getOrCreateSalt(): Promise<Uint8Array> {
    const stored = await chrome.storage.local.get('encryptionSalt');

    if (stored.encryptionSalt && typeof stored.encryptionSalt === 'string') {
      return this.base64ToUint8Array(stored.encryptionSalt);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    await chrome.storage.local.set({
      encryptionSalt: this.uint8ArrayToBase64(salt),
    });
    return salt;
  }

  private async deriveKey(
    deviceId: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceId),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
    if (!this.initialized || !this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      data
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.uint8ArrayToBase64(iv),
    };
  }

  async decrypt(ciphertext: string, iv: string): Promise<string> {
    if (!this.initialized || !this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    const data = this.base64ToArrayBuffer(ciphertext);
    const ivArray = this.base64ToUint8Array(iv);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray.buffer as ArrayBuffer },
      this.masterKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private uint8ArrayToBase64(array: Uint8Array): string {
    return this.arrayBufferToBase64(array.buffer as ArrayBuffer);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(this.base64ToArrayBuffer(base64));
  }
}

export const encryptionService = new EncryptionService();
