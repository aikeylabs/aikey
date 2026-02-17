import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '@/types';
import { MessageType } from '@/types/messages';
import { sendMessage } from '@/utils/messaging';
import './ProfileSelector.css';

interface ProfileSelectorProps {
  onProfileChange?: (profile: Profile) => void;
  onManageClick?: () => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  onProfileChange,
  onManageClick,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadProfiles = async () => {
    try {
      const [profiles, currentProfile] = await Promise.all([
        sendMessage<Profile[]>(MessageType.GET_PROFILES),
        sendMessage<Profile>(MessageType.GET_CURRENT_PROFILE),
      ]);

      setProfiles(profiles);
      setCurrentProfile(currentProfile);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleSwitchProfile = async (profile: Profile) => {
    try {
      await sendMessage(MessageType.SWITCH_PROFILE, { profileId: profile.id });
      setCurrentProfile(profile);
      setIsOpen(false);
      onProfileChange?.(profile);
    } catch (error) {
      console.error('Failed to switch profile:', error);
    }
  };

  const handleManageClick = () => {
    setIsOpen(false);
    onManageClick?.();
  };

  if (!currentProfile) {
    return null;
  }

  return (
    <div className="profile-selector" ref={dropdownRef}>
      <button
        className="profile-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="profile-icon-small"
          style={{ backgroundColor: currentProfile.color }}
        >
          {currentProfile.icon}
        </div>
        <span className="profile-name-small">{currentProfile.name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">Switch Profile</div>

          <div className="profile-list-dropdown">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={`profile-item ${
                  profile.id === currentProfile.id ? 'active' : ''
                }`}
                onClick={() => handleSwitchProfile(profile)}
              >
                <div
                  className="profile-icon-small"
                  style={{ backgroundColor: profile.color }}
                >
                  {profile.icon}
                </div>
                <div className="profile-item-info">
                  <div className="profile-item-name">
                    {profile.name}
                    {profile.isDefault && (
                      <span className="badge-small">Default</span>
                    )}
                  </div>
                  {profile.metadata?.keyCount !== undefined && (
                    <div className="profile-item-meta">
                      {profile.metadata.keyCount} keys
                    </div>
                  )}
                </div>
                {profile.id === currentProfile.id && (
                  <span className="check-mark">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="profile-dropdown-footer">
            <button
              className="manage-profiles-btn"
              onClick={handleManageClick}
            >
              Manage Profiles
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
