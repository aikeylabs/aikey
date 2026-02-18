import React, { useState, useEffect } from 'react';
import { Profile, ProfileInput } from '@/types';
import { MessageType } from '@/types/messages';
import { sendMessage } from '@/utils/messaging';
import {
  PROFILE_COLORS,
  PROFILE_ICONS,
  canDeleteProfile,
  canRenameProfile,
} from '@/utils/profileUtils';

interface ProfileManagerProps {
  onClose?: () => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ onClose }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProfileInput>({
    name: '',
    color: PROFILE_COLORS[0],
    icon: PROFILE_ICONS[0],
    description: '',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profiles, currentProfile] = await Promise.all([
        sendMessage<Profile[]>(MessageType.GET_PROFILES),
        sendMessage<Profile>(MessageType.GET_CURRENT_PROFILE),
      ]);

      setProfiles(profiles);
      setCurrentProfile(currentProfile);
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      setError(null);
      await sendMessage(MessageType.CREATE_PROFILE, formData);
      await loadProfiles();
      setIsCreating(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;

    try {
      setError(null);
      await sendMessage(MessageType.UPDATE_PROFILE, {
        id: editingProfile.id,
        input: formData,
      });
      await loadProfiles();
      setEditingProfile(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async (profile: Profile) => {
    const { canDelete, reason } = canDeleteProfile(profile, profiles.length);
    if (!canDelete) {
      setError(reason || 'Cannot delete this profile');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${profile.name}"?`)) {
      return;
    }

    try {
      setError(null);
      await sendMessage(MessageType.DELETE_PROFILE, { id: profile.id });
      await loadProfiles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
    }
  };

  const handleSwitchProfile = async (profileId: string) => {
    try {
      setError(null);
      await sendMessage(MessageType.SWITCH_PROFILE, { profileId });
      await loadProfiles();
    } catch (err: any) {
      setError(err.message || 'Failed to switch profile');
    }
  };

  const handleSetDefault = async (profileId: string) => {
    try {
      setError(null);
      await sendMessage(MessageType.SET_DEFAULT_PROFILE, { id: profileId });
      await loadProfiles();
    } catch (err: any) {
      setError(err.message || 'Failed to set default profile');
    }
  };

  const startEdit = (profile: Profile) => {
    // Prevent editing built-in profiles (Personal/Work)
    const { canRename, reason } = canRenameProfile(profile);
    if (!canRename) {
      setError(reason || 'Cannot edit this profile');
      return;
    }

    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      color: profile.color,
      icon: profile.icon,
      description: profile.metadata?.description || '',
    });
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingProfile(null);
    resetForm();
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingProfile(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: PROFILE_COLORS[0],
      icon: PROFILE_ICONS[0],
      description: '',
    });
  };

  if (loading) {
    return (
      <div className="profile-manager">
        <div className="loading">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="profile-manager">
      <div className="profile-manager-header">
        <h2>Profile Management</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Profile List */}
      {!isCreating && !editingProfile && (
        <div className="profile-list">
          <div className="profile-list-header">
            <h3>Your Profiles</h3>
            <button className="btn-primary" onClick={startCreate}>
              + New Profile
            </button>
          </div>

          <div className="profiles">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`profile-card ${currentProfile?.id === profile.id ? 'active' : ''}`}
              >
                <div className="profile-info">
                  <div
                    className="profile-icon"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.icon}
                  </div>
                  <div className="profile-details">
                    <div className="profile-name">
                      {profile.name}
                      {profile.isDefault && (
                        <span className="badge">Default</span>
                      )}
                      {profile.isBuiltIn && (
                        <span className="badge">Built-in</span>
                      )}
                    </div>
                    {profile.metadata?.description && (
                      <div className="profile-description">
                        {profile.metadata.description}
                      </div>
                    )}
                    <div className="profile-meta">
                      {profile.metadata?.keyCount || 0} keys
                    </div>
                  </div>
                </div>

                <div className="profile-actions">
                  {currentProfile?.id !== profile.id && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleSwitchProfile(profile.id)}
                    >
                      Switch
                    </button>
                  )}
                  {!profile.isDefault && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleSetDefault(profile.id)}
                    >
                      Set Default
                    </button>
                  )}
                  {!profile.isBuiltIn && (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => startEdit(profile)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteProfile(profile)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingProfile) && (
        <div className="profile-form">
          <h3>{isCreating ? 'Create New Profile' : 'Edit Profile'}</h3>

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Personal, Work, Testing"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Icon *</label>
            <div className="icon-picker">
              {PROFILE_ICONS.map((icon) => (
                <button
                  key={icon}
                  className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color *</label>
            <div className="color-picker">
              {PROFILE_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this profile"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={isCreating ? handleCreateProfile : handleUpdateProfile}
              disabled={!formData.name.trim()}
            >
              {isCreating ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
