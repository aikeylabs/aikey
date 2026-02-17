// Core data types for AiKey extension

export type ServiceType = 'OpenAI' | 'Anthropic' | 'Azure OpenAI' | 'Groq' | 'Custom';

export interface EncryptedKey {
  id: string;
  encryptedValue: string; // AES-256-GCM encrypted
  iv: string; // Initialization vector
  service: ServiceType;
  name: string;
  tag?: string;
  profileId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  id: string;
  name: string;
  color: string;        // Hex color (e.g., '#1976d2')
  icon: string;         // Emoji or icon name (e.g., '👤')
  isDefault: boolean;   // Is this the default profile?
  isBuiltIn: boolean;   // Cannot delete built-in profiles
  createdAt: number;
  updatedAt: number;
  metadata?: {
    keyCount?: number;
    lastUsed?: number;
    description?: string;
  };
}

export interface SiteBinding {
  id: string;
  domain: string;
  profileId: string;
  keyId: string;
  service: ServiceType;
  createdAt: number;
}

export interface UsageLog {
  id: string;
  keyId: string;
  domain: string;
  profileId: string;
  timestamp: number;
  action: 'fill' | 'copy';
}

// Decrypted key (only used in memory, never stored)
export interface DecryptedKey extends Omit<EncryptedKey, 'encryptedValue' | 'iv'> {
  apiKey: string;
}

// For display purposes (partial key)
export interface KeyDisplay extends Omit<EncryptedKey, 'encryptedValue' | 'iv'> {
  keyPrefix: string; // e.g., "sk-****abcd"
}

// Profile settings
export interface ProfileSettings {
  defaultProfileId: string;
  rememberProfilePerDomain: boolean;
  showProfileTips: boolean;
}

// Domain profile preference
export interface DomainProfilePreference {
  id: string;
  domain: string;
  profileId: string;
  createdAt: number;
}

// Profile creation/update input
export interface ProfileInput {
  name: string;
  color: string;
  icon: string;
  description?: string;
}
