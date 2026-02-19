// Profile utility functions and constants

export const PROFILE_COLORS = [
  '#1976d2', // Blue (Personal default)
  '#388e3c', // Green (Work default)
  '#d32f2f', // Red
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#0097a7', // Cyan
  '#c2185b', // Pink
  '#5d4037', // Brown
  '#455a64', // Blue Grey
  '#00897b', // Teal
];

export const PROFILE_ICONS = [
  '👤', // Person (Personal default)
  '💼', // Briefcase (Work default)
  '🧪', // Test tube (Testing)
  '🎓', // Graduation cap (Learning)
  '🏠', // House (Home)
  '🚀', // Rocket (Projects)
  '🎨', // Art (Creative)
  '⚙️', // Gear (Development)
  '🔬', // Microscope (Research)
  '💻', // Laptop (Coding)
  '🌟', // Star (Favorite)
  '🎯', // Target (Goals)
];

export const DEFAULT_PROFILES = {
  PERSONAL: {
    id: 'personal',
    name: 'Personal',
    color: '#1976d2',
    icon: '👤',
    isDefault: true,
    isBuiltIn: true,
  },
  WORK: {
    id: 'work',
    name: 'Work',
    color: '#388e3c',
    icon: '💼',
    isDefault: false,
    isBuiltIn: true,
  },
};

/**
 * Validate profile name
 */
export function validateProfileName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Profile name is required';
  }
  if (name.trim().length < 2) {
    return 'Profile name must be at least 2 characters';
  }
  if (name.trim().length > 50) {
    return 'Profile name must be less than 50 characters';
  }
  return null;
}

/**
 * Validate profile color (hex format)
 */
export function validateProfileColor(color: string): string | null {
  if (!color) {
    return 'Profile color is required';
  }
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexRegex.test(color)) {
    return 'Invalid color format (use hex format like #1976d2)';
  }
  return null;
}

/**
 * Validate profile icon
 */
export function validateProfileIcon(icon: string): string | null {
  if (!icon || icon.trim().length === 0) {
    return 'Profile icon is required';
  }
  return null;
}

/**
 * Generate a unique profile ID
 */
export function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get a random color from the palette
 */
export function getRandomColor(): string {
  return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
}

/**
 * Get a random icon from the palette
 */
export function getRandomIcon(): string {
  return PROFILE_ICONS[Math.floor(Math.random() * PROFILE_ICONS.length)];
}

/**
 * Check if a profile can be deleted
 */
export function canDeleteProfile(
  profile: { isBuiltIn: boolean; id: string; metadata?: { keyCount?: number } },
  totalProfiles: number
): { canDelete: boolean; reason?: string } {
  if (profile.isBuiltIn) {
    return { canDelete: false, reason: 'Cannot delete built-in profiles' };
  }
  if (totalProfiles <= 1) {
    return { canDelete: false, reason: 'Cannot delete the last profile' };
  }
  const keyCount = profile.metadata?.keyCount || 0;
  if (keyCount > 0) {
    return {
      canDelete: false,
      reason: 'This profile still has keys. Move or delete its keys before removing the profile.'
    };
  }
  return { canDelete: true };
}

/**
 * Check if a profile can be renamed
 */
export function canRenameProfile(profile: { isBuiltIn: boolean }): { canRename: boolean; reason?: string } {
  if (profile.isBuiltIn) {
    return { canRename: false, reason: 'Built-in profiles (Personal and Work) cannot be renamed in M1' };
  }
  return { canRename: true };
}

/**
 * Format profile display name with icon
 */
export function formatProfileDisplay(name: string, icon: string): string {
  return `${icon} ${name}`;
}
