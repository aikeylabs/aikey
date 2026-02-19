// Utility functions for sending messages to background script

import { MessageType, type Message, type MessageResponse } from '@/types/messages';

export async function sendMessage<T = any>(
  type: MessageType,
  payload?: any
): Promise<T> {
  // Check if chrome.runtime is available
  if (!chrome?.runtime?.sendMessage) {
    throw new Error('Chrome runtime not available');
  }

  const message: Message = {
    type,
    payload,
    requestId: crypto.randomUUID(),
  };

  try {
    const response: MessageResponse<T> = await chrome.runtime.sendMessage(message);

    if (!response) {
      throw new Error('No response from background script');
    }

    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }

    return response.data as T;
  } catch (error: any) {
    console.error('Message error:', error);
    throw new Error(error.message || 'Failed to communicate with background script');
  }
}

// Convenience functions
export const api = {
  // Keys
  addKey: (data: {
    service: string;
    apiKey: string;
    name?: string;
    tag?: string;
    profileId?: string;
  }) => sendMessage(MessageType.ADD_KEY, data),

  getKeys: (profileId?: string) =>
    sendMessage(MessageType.GET_KEYS, { profileId }),

  getKeyById: (keyId: string) =>
    sendMessage(MessageType.GET_KEY_BY_ID, { keyId }),

  decryptKey: (keyId: string) =>
    sendMessage(MessageType.DECRYPT_KEY, { keyId }),

  updateKey: (key: any) =>
    sendMessage(MessageType.UPDATE_KEY, { key }),

  deleteKey: (keyId: string) =>
    sendMessage(MessageType.DELETE_KEY, { keyId }),

  // Profiles
  getProfiles: () => sendMessage(MessageType.GET_PROFILES),

  getCurrentProfile: () => sendMessage(MessageType.GET_CURRENT_PROFILE),

  switchProfile: (profileId: string) =>
    sendMessage(MessageType.SWITCH_PROFILE, { profileId }),

  // Fill
  fillKey: (keyId: string, domain: string) =>
    sendMessage(MessageType.FILL_KEY, { keyId, domain }),

  getSiteRecommendations: (domain: string, profileId: string) =>
    sendMessage(MessageType.GET_SITE_RECOMMENDATIONS, { domain, profileId }),

  // Bindings
  createBinding: (binding: any) =>
    sendMessage(MessageType.CREATE_BINDING, binding),

  // Usage
  logKeyUsage: (keyId: string, domain: string, action: 'fill' | 'copy') =>
    sendMessage(MessageType.LOG_KEY_USAGE, { keyId, domain, action }),

  // Init
  initExtension: () => sendMessage(MessageType.INIT_EXTENSION),

  // Settings
  getProfileSettings: () => sendMessage(MessageType.GET_SETTINGS),
  updateProfileSettings: (settings: any) =>
    sendMessage(MessageType.UPDATE_SETTINGS, settings),

  // Domain profile preferences
  setDomainProfilePreference: (domain: string, profileId: string) =>
    sendMessage(MessageType.SET_DOMAIN_PROFILE_PREFERENCE, { domain, profileId }),
  getDomainProfilePreference: (domain: string) =>
    sendMessage(MessageType.GET_DOMAIN_PROFILE_PREFERENCE, { domain }),
};
