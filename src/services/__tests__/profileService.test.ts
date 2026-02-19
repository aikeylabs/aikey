import { describe, it, expect, beforeEach, vi } from 'vitest';
import { profileService } from '@/services/profileService';
import type { Profile, ProfileInput } from '@/types';

// Mock storage service
vi.mock('@/services/storage', () => ({
  storageService: {
    getKeysByProfile: vi.fn().mockResolvedValue([]),
    getAllBindings: vi.fn().mockResolvedValue([]),
    deleteKey: vi.fn().mockResolvedValue(undefined),
    deleteBinding: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock IndexedDB
let mockProfiles: Map<string, Profile> = new Map();
let mockSettings: Map<string, any> = new Map();

const createMockRequest = (result?: any, error?: any) => {
  const request = {
    onerror: null as any,
    onsuccess: null as any,
    error,
    result,
  };

  setTimeout(() => {
    if (error && request.onerror) {
      request.onerror({ target: request } as any);
    } else if (request.onsuccess) {
      request.onsuccess({ target: request } as any);
    }
  }, 0);

  return request;
};

const mockObjectStore = (storeName: string) => ({
  add: vi.fn((value: any) => {
    if (storeName === 'profiles') {
      mockProfiles.set(value.id, value);
    }
    return createMockRequest();
  }),
  get: vi.fn((key: string) => {
    let result;
    if (storeName === 'profiles') {
      result = mockProfiles.get(key) || null;
    } else if (storeName === 'settings') {
      result = mockSettings.get(key) || null;
    }
    return createMockRequest(result);
  }),
  put: vi.fn((value: any) => {
    if (storeName === 'profiles') {
      mockProfiles.set(value.id, value);
    } else if (storeName === 'settings') {
      mockSettings.set(value.key, value);
    }
    return createMockRequest();
  }),
  delete: vi.fn((key: string) => {
    if (storeName === 'profiles') {
      mockProfiles.delete(key);
    } else if (storeName === 'settings') {
      mockSettings.delete(key);
    }
    return createMockRequest();
  }),
  getAll: vi.fn(() => {
    let result: any[] = [];
    if (storeName === 'profiles') {
      result = Array.from(mockProfiles.values());
    }
    return createMockRequest(result);
  }),
});

const mockIndexedDB = {
  open: vi.fn(() => {
    const request = {
      onerror: null as any,
      onsuccess: null as any,
      onupgradeneeded: null as any,
      result: {
        transaction: vi.fn((storeNames: string | string[], mode?: string) => {
          const tx = {
            objectStore: vi.fn((storeName: string) => mockObjectStore(storeName)),
            oncomplete: null as any,
            onerror: null as any,
            error: null as any,
          };

          // Simulate transaction completion
          setTimeout(() => {
            if (tx.oncomplete) {
              tx.oncomplete({} as any);
            }
          }, 0);

          return tx;
        }),
      },
    };

    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);

    return request;
  }),
};

global.indexedDB = mockIndexedDB as any;

describe('ProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfiles.clear();
    mockSettings.clear();
  });

  describe('createProfile', () => {
    it('should create a new profile with valid input', async () => {
      const input: ProfileInput = {
        name: 'Test Profile',
        color: '#1E88E5',
        icon: '🔑',
        description: 'Test description',
      };

      const result = await profileService.createProfile(input);

      expect(result.name).toBe(input.name);
      expect(result.color).toBe(input.color);
      expect(result.icon).toBe(input.icon);
      expect(result.isBuiltIn).toBe(false);
      expect(result.isDefault).toBe(false);
      expect(mockProfiles.has(result.id)).toBe(true);
    });

    it('should throw error for invalid profile name', async () => {
      const input: ProfileInput = {
        name: '', // Invalid: empty name
        color: '#1E88E5',
        icon: '🔑',
      };

      await expect(profileService.createProfile(input)).rejects.toThrow(
        'Profile name is required'
      );
    });

    it('should throw error for name that is too short', async () => {
      const input: ProfileInput = {
        name: 'A', // Invalid: only 1 character
        color: '#1E88E5',
        icon: '🔑',
      };

      await expect(profileService.createProfile(input)).rejects.toThrow(
        'Profile name must be at least 2 characters'
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const input: ProfileInput = {
        name: 'Original Name',
        color: '#1E88E5',
        icon: '🔑',
      };

      const profile = await profileService.createProfile(input);

      const updateInput: ProfileInput = {
        name: 'Updated Name',
        color: '#FF5722',
        icon: '🎯',
      };

      const updated = await profileService.updateProfile(profile.id, updateInput);

      expect(updated.name).toBe(updateInput.name);
      expect(updated.color).toBe(updateInput.color);
      expect(updated.icon).toBe(updateInput.icon);
    });

    it('should throw error when updating non-existent profile', async () => {
      const input: ProfileInput = {
        name: 'Test',
        color: '#1E88E5',
        icon: '🔑',
      };

      await expect(
        profileService.updateProfile('non-existent', input)
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('deleteProfile', () => {
    it('should delete non-built-in profile', async () => {
      const input: ProfileInput = {
        name: 'Test Profile',
        color: '#1E88E5',
        icon: '🔑',
      };

      const profile = await profileService.createProfile(input);

      // Create another profile so we're not deleting the last one
      await profileService.createProfile({
        name: 'Another Profile',
        color: '#FF5722',
        icon: '🎯',
      });

      await profileService.deleteProfile(profile.id);

      expect(mockProfiles.has(profile.id)).toBe(false);
    });

    it('should throw error when deleting built-in profile', async () => {
      const profile: Profile = {
        id: 'built-in-id',
        name: 'Built-in Profile',
        color: '#1E88E5',
        icon: '🔑',
        isBuiltIn: true,
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockProfiles.set(profile.id, profile);

      await expect(profileService.deleteProfile(profile.id)).rejects.toThrow(
        'Cannot delete built-in profile'
      );
    });

    it('should throw error when deleting last profile', async () => {
      const input: ProfileInput = {
        name: 'Last Profile',
        color: '#1E88E5',
        icon: '🔑',
      };

      const profile = await profileService.createProfile(input);

      await expect(profileService.deleteProfile(profile.id)).rejects.toThrow(
        'Cannot delete the last profile'
      );
    });
  });

  describe('setDefaultProfile', () => {
    it('should set default profile successfully', async () => {
      const input: ProfileInput = {
        name: 'Test Profile',
        color: '#1E88E5',
        icon: '🔑',
      };

      const profile = await profileService.createProfile(input);

      await profileService.setDefaultProfile(profile.id);

      const defaultProfile = await profileService.getDefaultProfile();
      expect(defaultProfile?.id).toBe(profile.id);
      expect(defaultProfile?.isDefault).toBe(true);
    });
  });

  describe('getDefaultProfile', () => {
    it('should return default profile', async () => {
      const input: ProfileInput = {
        name: 'Default Profile',
        color: '#1E88E5',
        icon: '🔑',
      };

      const profile = await profileService.createProfile(input);
      await profileService.setDefaultProfile(profile.id);

      const result = await profileService.getDefaultProfile();

      expect(result?.id).toBe(profile.id);
      expect(result?.isDefault).toBe(true);
    });

    it('should return first profile if no default set', async () => {
      const input: ProfileInput = {
        name: 'First Profile',
        color: '#1E88E5',
        icon: '🔑',
      };

      const profile = await profileService.createProfile(input);

      const result = await profileService.getDefaultProfile();

      expect(result?.id).toBe(profile.id);
    });
  });
});
