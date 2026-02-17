// Background service worker - central hub for extension

import { encryptionService } from '@/services/encryption';
import { storageService } from '@/services/storage';
import { profileService } from '@/services/profileService';
import { MessageType, type Message, type MessageResponse } from '@/types/messages';
import type { EncryptedKey, ServiceType, ProfileInput } from '@/types';

// Initialize services on startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AiKey extension installed');
  await initializeExtension();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('AiKey extension started');
  await initializeExtension();
});

async function initializeExtension() {
  try {
    await encryptionService.initialize();
    await storageService.initialize();
    await profileService.init();

    // Initialize default profiles using profileService
    await profileService.initializeDefaultProfiles();

    // Get default profile
    const defaultProfile = await profileService.getDefaultProfile();
    if (defaultProfile) {
      await storageService.setMetadata('currentProfile', defaultProfile.id);
    }

    console.log('AiKey initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AiKey:', error);
  }
}

// Remove old createDefaultProfiles function as it's now handled by profileService

// Message handler
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    console.log('Background received message:', message.type);
    handleMessage(message, _sender)
      .then((response) => {
        console.log('Background sending response:', response);
        sendResponse(response);
      })
      .catch((error) => {
        console.error('Background error:', error);
        sendResponse({
          success: false,
          error: error.message,
          requestId: message.requestId,
        });
      });

    return true; // Keep channel open for async response
  }
);

async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  const { type, payload, requestId } = message;

  try {
    let data: any;

    switch (type) {
      case MessageType.INIT_EXTENSION:
        await initializeExtension();
        data = { initialized: true };
        break;

      case MessageType.ADD_KEY:
        data = await handleAddKey(payload);
        break;

      case MessageType.GET_KEYS:
        data = await handleGetKeys(payload);
        break;

      case MessageType.GET_KEY_BY_ID:
        data = await handleGetKeyById(payload);
        break;

      case MessageType.DECRYPT_KEY:
        data = await handleDecryptKey(payload);
        break;

      case MessageType.DELETE_KEY:
        await storageService.deleteKey(payload.keyId);
        data = { deleted: true };
        break;

      case MessageType.GET_PROFILES:
        data = await profileService.getAllProfiles();
        break;

      case MessageType.GET_CURRENT_PROFILE:
        const currentProfileId = await storageService.getMetadata('currentProfile');
        data = await profileService.getProfileById(currentProfileId);
        break;

      case MessageType.SWITCH_PROFILE:
        await storageService.setMetadata('currentProfile', payload.profileId);
        await profileService.updateProfileMetadata(payload.profileId, { lastUsed: Date.now() });
        data = { switched: true };
        break;

      case MessageType.CREATE_PROFILE:
        data = await profileService.createProfile(payload as ProfileInput);
        break;

      case MessageType.UPDATE_PROFILE:
        data = await profileService.updateProfile(payload.id, payload.input);
        break;

      case MessageType.DELETE_PROFILE:
        await profileService.deleteProfile(payload.id);
        data = { deleted: true };
        break;

      case MessageType.SET_DEFAULT_PROFILE:
        await profileService.setDefaultProfile(payload.id);
        data = { success: true };
        break;

      case MessageType.GET_SETTINGS:
        data = await profileService.getSettings();
        break;

      case MessageType.UPDATE_SETTINGS:
        data = await profileService.updateSettings(payload);
        break;

      case MessageType.SET_DOMAIN_PROFILE_PREFERENCE:
        await profileService.setDomainProfilePreference(payload.domain, payload.profileId);
        data = { success: true };
        break;

      case MessageType.GET_DOMAIN_PROFILE_PREFERENCE:
        data = await profileService.getDomainProfilePreference(payload.domain);
        break;

      case MessageType.CREATE_BINDING:
        await storageService.addBinding(payload);
        data = { created: true };
        break;

      case MessageType.GET_SITE_RECOMMENDATIONS:
        data = await handleGetSiteRecommendations(payload);
        break;

      case MessageType.LOG_KEY_USAGE:
        await handleLogUsage(payload);
        data = { logged: true };
        break;

      case MessageType.FILL_KEY:
        data = await handleFillKey(payload, sender);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    return {
      success: true,
      data,
      requestId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      requestId,
    };
  }
}

async function handleAddKey(payload: {
  service: ServiceType;
  apiKey: string;
  name?: string;
  tag?: string;
  profileId?: string;
}) {
  const { service, apiKey, name, tag, profileId } = payload;

  // Get current profile if not specified
  let targetProfileId: string = profileId || '';
  if (!targetProfileId) {
    const currentProfileId = await storageService.getMetadata('currentProfile');
    if (!currentProfileId || typeof currentProfileId !== 'string') {
      throw new Error('No current profile set');
    }
    targetProfileId = currentProfileId;
  }

  // Encrypt the API key
  const { ciphertext, iv } = await encryptionService.encrypt(apiKey);

  // Generate name if not provided
  const profile = await storageService.getProfile(targetProfileId);
  const keyName = name || `${service} - ${profile?.name || 'Unknown'}`;

  const encryptedKey: EncryptedKey = {
    id: crypto.randomUUID(),
    encryptedValue: ciphertext,
    iv,
    service,
    name: keyName,
    ...(tag && { tag }),
    profileId: targetProfileId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await storageService.addKey(encryptedKey);

  return { keyId: encryptedKey.id };
}

async function handleGetKeys(payload: { profileId?: string }) {
  const { profileId } = payload;

  let keys: EncryptedKey[];
  if (profileId) {
    keys = await storageService.getKeysByProfile(profileId);
  } else {
    keys = await storageService.getAllKeys();
  }

  // Return keys with partial display (never full encrypted value)
  return keys.map((key) => ({
    ...key,
    encryptedValue: undefined,
    iv: undefined,
    keyPrefix: generateKeyPrefix(key.service),
  }));
}

async function handleGetKeyById(payload: { keyId: string }) {
  const key = await storageService.getKey(payload.keyId);
  if (!key) {
    throw new Error('Key not found');
  }

  return {
    ...key,
    encryptedValue: undefined,
    iv: undefined,
    keyPrefix: generateKeyPrefix(key.service),
  };
}

async function handleDecryptKey(payload: { keyId: string }) {
  const key = await storageService.getKey(payload.keyId);
  if (!key) {
    throw new Error('Key not found');
  }

  const apiKey = await encryptionService.decrypt(key.encryptedValue, key.iv);

  return {
    ...key,
    apiKey,
    encryptedValue: undefined,
    iv: undefined,
  };
}

async function handleGetSiteRecommendations(payload: {
  domain: string;
  profileId: string;
}) {
  const bindings = await storageService.getBindingsByDomain(
    payload.domain,
    payload.profileId
  );

  const recommendations = [];
  for (const binding of bindings) {
    const key = await storageService.getKey(binding.keyId);
    if (key) {
      recommendations.push({
        ...key,
        encryptedValue: undefined,
        iv: undefined,
        keyPrefix: generateKeyPrefix(key.service),
      });
    }
  }

  return recommendations;
}

async function handleLogUsage(payload: {
  keyId: string;
  domain: string;
  action: 'fill' | 'copy';
}) {
  const currentProfileId = await storageService.getMetadata('currentProfile');

  await storageService.addUsageLog({
    id: crypto.randomUUID(),
    keyId: payload.keyId,
    domain: payload.domain,
    profileId: currentProfileId,
    timestamp: Date.now(),
    action: payload.action,
  });
}

async function handleFillKey(
  payload: { keyId: string; domain: string },
  sender: chrome.runtime.MessageSender
) {
  // Decrypt the key
  const decryptedKey = await handleDecryptKey({ keyId: payload.keyId });

  // Send to content script
  if (sender.tab?.id) {
    await chrome.tabs.sendMessage(sender.tab.id, {
      type: 'FILL_KEY_VALUE',
      payload: {
        apiKey: decryptedKey.apiKey,
        service: decryptedKey.service,
      },
    });
  }

  // Log usage
  await handleLogUsage({
    keyId: payload.keyId,
    domain: payload.domain,
    action: 'fill',
  });

  return { filled: true };
}

function generateKeyPrefix(service: ServiceType): string {
  const prefixes: Record<ServiceType, string> = {
    OpenAI: 'sk-****',
    Anthropic: 'sk-ant-****',
    'Azure OpenAI': 'az-****',
    Groq: 'gsk-****',
    Custom: '****',
  };

  return prefixes[service] || '****';
}
