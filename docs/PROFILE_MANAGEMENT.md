# Profile Management Feature

## Overview

The Profile Management feature allows users to organize their API keys into different profiles (e.g., Personal, Work, Testing). Each profile can have its own set of keys, custom appearance, and settings.

## Architecture

### Core Components

1. **ProfileService** (`src/services/profileService.ts`)
   - Manages all profile-related operations
   - Handles profile CRUD operations
   - Manages profile settings and preferences
   - Validates profile data

2. **ProfileManager Component** (`src/components/ProfileManager.tsx`)
   - Full-featured profile management UI
   - Create, edit, delete profiles
   - Set default profile
   - Customize profile appearance (icon, color)

3. **ProfileSelector Component** (`src/components/ProfileSelector.tsx`)
   - Quick profile switcher for popup
   - Shows current profile
   - Dropdown to switch between profiles

### Data Structure

#### Profile Type
```typescript
interface Profile {
  id: string;
  name: string;
  color: string;
  icon: string;
  isBuiltIn: boolean;
  isDefault: boolean;
  createdAt: number;
  metadata?: {
    description?: string;
    keyCount?: number;
    lastUsed?: number;
  };
}
```

#### ProfileInput Type
```typescript
interface ProfileInput {
  name: string;
  color: string;
  icon: string;
  description?: string;
}
```

## Features

### 1. Profile Creation
- Custom name (required, max 50 characters)
- Choose from predefined icons
- Choose from predefined colors
- Optional description (max 200 characters)

### 2. Profile Management
- View all profiles
- Edit profile details
- Delete profiles (with restrictions)
- Set default profile
- Switch between profiles

### 3. Built-in Profiles
- Personal (default)
- Work
- Cannot be deleted
- Can be customized

### 4. Profile Settings
```typescript
interface ProfileSettings {
  autoSwitchByDomain: boolean;
  showProfileInPopup: boolean;
  confirmBeforeSwitch: boolean;
}
```

### 5. Domain-Profile Preferences
- Associate specific domains with profiles
- Auto-switch profile based on current domain
- Configurable per domain

## Usage

### Using ProfileService

```typescript
import { profileService } from '@/services/profileService';

// Initialize
await profileService.init();

// Create a profile
const newProfile = await profileService.createProfile({
  name: 'Testing',
  color: '#FF5722',
  icon: '🧪',
  description: 'For testing purposes',
});

// Get all profiles
const profiles = await profileService.getAllProfiles();

// Update a profile
await profileService.updateProfile(profileId, {
  name: 'Updated Name',
  color: '#4CAF50',
});

// Delete a profile
await profileService.deleteProfile(profileId);

// Set default profile
await profileService.setDefaultProfile(profileId);

// Get default profile
const defaultProfile = await profileService.getDefaultProfile();

// Domain preferences
await profileService.setDomainProfilePreference('example.com', profileId);
const preferredProfile = await profileService.getDomainProfilePreference('example.com');
```

### Using ProfileManager Component

```tsx
import { ProfileManager } from '@/components';

function SettingsPage() {
  return (
    <ProfileManager
      onClose={() => {
        // Handle close
      }}
    />
  );
}
```

### Using ProfileSelector Component

```tsx
import { ProfileSelector } from '@/components';

function Popup() {
  return (
    <ProfileSelector
      onProfileChange={(profile) => {
        console.log('Switched to:', profile.name);
      }}
      onManageClick={() => {
        // Open profile manager
      }}
    />
  );
}
```

## Message Types

The following message types are used for profile operations:

- `CREATE_PROFILE` - Create a new profile
- `UPDATE_PROFILE` - Update an existing profile
- `DELETE_PROFILE` - Delete a profile
- `SWITCH_PROFILE` - Switch to a different profile
- `GET_PROFILES` - Get all profiles
- `GET_CURRENT_PROFILE` - Get the currently active profile
- `SET_DEFAULT_PROFILE` - Set a profile as default
- `GET_SETTINGS` - Get profile settings
- `UPDATE_SETTINGS` - Update profile settings
- `SET_DOMAIN_PROFILE_PREFERENCE` - Set domain-profile association
- `GET_DOMAIN_PROFILE_PREFERENCE` - Get domain-profile association

## Validation Rules

### Profile Creation/Update
- Name: Required, 1-50 characters, must be unique
- Color: Must be from predefined list
- Icon: Must be from predefined list
- Description: Optional, max 200 characters

### Profile Deletion
- Cannot delete built-in profiles
- Cannot delete the last remaining profile
- Cannot delete the default profile (must set another as default first)

## Utility Functions

### profileUtils.ts

```typescript
// Predefined colors
export const PROFILE_COLORS = [
  '#1E88E5', '#43A047', '#FB8C00', '#E53935',
  '#8E24AA', '#00ACC1', '#FDD835', '#6D4C41',
];

// Predefined icons
export const PROFILE_ICONS = [
  '🔑', '💼', '🏠', '🧪', '🎨', '🚀', '⚡', '🌟',
];

// Format profile for display
export function formatProfileDisplay(profile: Profile): string;

// Check if profile can be deleted
export function canDeleteProfile(
  profile: Profile,
  totalProfiles: number
): { canDelete: boolean; reason?: string };

// Get profile by domain
export function getProfileForDomain(
  domain: string,
  profiles: Profile[]
): Profile | null;
```

## Storage

Profiles are stored in Chrome's local storage using the StorageService:

- Profile data: `profiles` key
- Current profile: `currentProfile` metadata
- Domain preferences: `domainProfilePreferences` metadata
- Settings: `profileSettings` metadata

## Testing

Run tests with:
```bash
npm test src/services/__tests__/profileService.test.ts
```

## Future Enhancements

1. Profile import/export
2. Profile templates
3. Profile sharing between devices
4. Profile-specific encryption keys
5. Profile usage analytics
6. Bulk operations (move keys between profiles)
7. Profile search and filtering
8. Profile tags/categories
