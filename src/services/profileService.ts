// Profile management service
import { Profile, ProfileInput, ProfileSettings, DomainProfilePreference } from '../types';
import {
  generateProfileId,
  validateProfileName,
  validateProfileColor,
  validateProfileIcon,
  canDeleteProfile,
  DEFAULT_PROFILES
} from '../utils/profileUtils';

const PROFILES_STORE = 'profiles';
const SETTINGS_STORE = 'settings';
const DOMAIN_PREFS_STORE = 'domainProfilePreferences';
const DB_NAME = 'aikey-vault';
const DB_VERSION = 3; // Increment version for new stores

class ProfileService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create profiles store if it doesn't exist
        if (!db.objectStoreNames.contains(PROFILES_STORE)) {
          db.createObjectStore(PROFILES_STORE, { keyPath: 'id' });
        }

        // Create settings store if it doesn't exist
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }

        // Create domain preferences store if it doesn't exist
        if (!db.objectStoreNames.contains(DOMAIN_PREFS_STORE)) {
          const store = db.createObjectStore(DOMAIN_PREFS_STORE, { keyPath: 'id' });
          store.createIndex('domain', 'domain', { unique: true });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  /**
   * Initialize default profiles if they don't exist
   */
  async initializeDefaultProfiles(): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction(PROFILES_STORE, 'readwrite');
    const store = tx.objectStore(PROFILES_STORE);

    // Check if profiles exist
    const count = await new Promise<number>((resolve, reject) => {
      const countRequest = store.count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    // If no profiles exist, create defaults
    if (count === 0) {
      const now = Date.now();

      const personalProfile: Profile = {
        ...DEFAULT_PROFILES.PERSONAL,
        createdAt: now,
        updatedAt: now,
      };

      const workProfile: Profile = {
        ...DEFAULT_PROFILES.WORK,
        createdAt: now,
        updatedAt: now,
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(PROFILES_STORE, 'readwrite');
        const store = tx.objectStore(PROFILES_STORE);

        store.add(personalProfile);
        store.add(workProfile);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Set default settings
      await this.updateSettings({
        defaultProfileId: 'personal',
        rememberProfilePerDomain: true,
        showProfileTips: true,
      });
    }
  }

  /**
   * Get all profiles
   */
  async getAllProfiles(): Promise<Profile[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILES_STORE, 'readonly');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get profile by ID
   */
  async getProfileById(id: string): Promise<Profile | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILES_STORE, 'readonly');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create a new profile
   */
  async createProfile(input: ProfileInput): Promise<Profile> {
    // Validate input
    const nameError = validateProfileName(input.name);
    if (nameError) throw new Error(nameError);

    const colorError = validateProfileColor(input.color);
    if (colorError) throw new Error(colorError);

    const iconError = validateProfileIcon(input.icon);
    if (iconError) throw new Error(iconError);

    const now = Date.now();
    const profile: Profile = {
      id: generateProfileId(),
      name: input.name.trim(),
      color: input.color,
      icon: input.icon,
      isDefault: false,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      metadata: {
        description: input.description,
        keyCount: 0,
        lastUsed: now,
      },
    };

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILES_STORE, 'readwrite');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.add(profile);

      request.onsuccess = () => resolve(profile);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update an existing profile
   */
  async updateProfile(id: string, input: Partial<ProfileInput>): Promise<Profile> {
    const existing = await this.getProfileById(id);
    if (!existing) {
      throw new Error('Profile not found');
    }

    // Validate input if provided
    if (input.name !== undefined) {
      const nameError = validateProfileName(input.name);
      if (nameError) throw new Error(nameError);
    }

    if (input.color !== undefined) {
      const colorError = validateProfileColor(input.color);
      if (colorError) throw new Error(colorError);
    }

    if (input.icon !== undefined) {
      const iconError = validateProfileIcon(input.icon);
      if (iconError) throw new Error(iconError);
    }

    const updated: Profile = {
      ...existing,
      ...(input.name && { name: input.name.trim() }),
      ...(input.color && { color: input.color }),
      ...(input.icon && { icon: input.icon }),
      updatedAt: Date.now(),
      metadata: {
        ...existing.metadata,
        ...(input.description !== undefined && { description: input.description }),
      },
    };

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILES_STORE, 'readwrite');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a profile and cascade delete associated keys and bindings
   */
  async deleteProfile(id: string): Promise<void> {
    const profile = await this.getProfileById(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const allProfiles = await this.getAllProfiles();
    const { canDelete, reason } = canDeleteProfile(profile, allProfiles.length);

    if (!canDelete) {
      throw new Error(reason || 'Cannot delete this profile');
    }

    // Import storage service dynamically to avoid circular dependency
    const { storageService } = await import('./storage');

    // Cascade delete: Get all keys and bindings for this profile
    const keys = await storageService.getKeysByProfile(id);
    const allBindings = await storageService.getAllBindings();
    const profileBindings = allBindings.filter(b => b.profileId === id);

    // Delete all keys associated with this profile
    for (const key of keys) {
      await storageService.deleteKey(key.id);
    }

    // Delete all bindings associated with this profile
    for (const binding of profileBindings) {
      await storageService.deleteBinding(binding.id);
    }

    // Finally, delete the profile itself
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILES_STORE, 'readwrite');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set default profile
   */
  async setDefaultProfile(id: string): Promise<void> {
    const profile = await this.getProfileById(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Update all profiles to set isDefault = false
    const allProfiles = await this.getAllProfiles();
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILES_STORE, 'readwrite');
      const store = tx.objectStore(PROFILES_STORE);

      allProfiles.forEach(p => {
        const updated = { ...p, isDefault: p.id === id };
        store.put(updated);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get default profile
   */
  async getDefaultProfile(): Promise<Profile | null> {
    const profiles = await this.getAllProfiles();
    return profiles.find(p => p.isDefault) || profiles[0] || null;
  }

  /**
   * Get settings
   */
  async getSettings(): Promise<ProfileSettings> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const store = tx.objectStore(SETTINGS_STORE);
      const request = store.get('profileSettings');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.value || {
          defaultProfileId: 'personal',
          rememberProfilePerDomain: true,
          showProfileTips: true,
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<ProfileSettings>): Promise<ProfileSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = tx.objectStore(SETTINGS_STORE);
      const request = store.put({ key: 'profileSettings', value: updated });

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set domain profile preference
   */
  async setDomainProfilePreference(domain: string, profileId: string): Promise<void> {
    const db = await this.ensureDb();
    const preference: DomainProfilePreference = {
      id: `pref_${domain}`,
      domain,
      profileId,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOMAIN_PREFS_STORE, 'readwrite');
      const store = tx.objectStore(DOMAIN_PREFS_STORE);
      const request = store.put(preference);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get domain profile preference
   */
  async getDomainProfilePreference(domain: string): Promise<string | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOMAIN_PREFS_STORE, 'readonly');
      const store = tx.objectStore(DOMAIN_PREFS_STORE);
      const index = store.index('domain');
      const request = index.get(domain);

      request.onsuccess = () => {
        const result = request.result as DomainProfilePreference | undefined;
        resolve(result?.profileId || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update profile metadata (key count, last used)
   */
  async updateProfileMetadata(id: string, metadata: Partial<Profile['metadata']>): Promise<void> {
    const profile = await this.getProfileById(id);
    if (!profile) return;

    const updated: Profile = {
      ...profile,
      metadata: {
        ...profile.metadata,
        ...metadata,
      },
      updatedAt: Date.now(),
    };

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROFILES_STORE, 'readwrite');
      const store = tx.objectStore(PROFILES_STORE);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const profileService = new ProfileService();
