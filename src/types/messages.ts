// Message protocol for extension communication

export enum MessageType {
  // Key operations
  ADD_KEY = 'ADD_KEY',
  UPDATE_KEY = 'UPDATE_KEY',
  DELETE_KEY = 'DELETE_KEY',
  GET_KEYS = 'GET_KEYS',
  GET_KEY_BY_ID = 'GET_KEY_BY_ID',
  DECRYPT_KEY = 'DECRYPT_KEY',

  // Profile operations
  CREATE_PROFILE = 'CREATE_PROFILE',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  DELETE_PROFILE = 'DELETE_PROFILE',
  SWITCH_PROFILE = 'SWITCH_PROFILE',
  GET_PROFILES = 'GET_PROFILES',
  GET_CURRENT_PROFILE = 'GET_CURRENT_PROFILE',
  SET_DEFAULT_PROFILE = 'SET_DEFAULT_PROFILE',

  // Settings operations
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',

  // Domain profile preferences
  SET_DOMAIN_PROFILE_PREFERENCE = 'SET_DOMAIN_PROFILE_PREFERENCE',
  GET_DOMAIN_PROFILE_PREFERENCE = 'GET_DOMAIN_PROFILE_PREFERENCE',

  // Fill operations
  FILL_KEY = 'FILL_KEY',
  GET_SITE_RECOMMENDATIONS = 'GET_SITE_RECOMMENDATIONS',

  // Site binding operations
  CREATE_BINDING = 'CREATE_BINDING',
  DELETE_BINDING = 'DELETE_BINDING',
  GET_BINDINGS = 'GET_BINDINGS',

  // Import operations
  IMPORT_FROM_ENV = 'IMPORT_FROM_ENV',

  // Usage log
  LOG_KEY_USAGE = 'LOG_KEY_USAGE',

  // Initialization
  INIT_EXTENSION = 'INIT_EXTENSION',
}

export interface Message<T = any> {
  type: MessageType;
  payload: T;
  requestId: string;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
}
