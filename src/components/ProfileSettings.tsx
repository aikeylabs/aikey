import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { api } from '@/utils/messaging';
import type { ProfileSettings as ProfileSettingsType } from '@/types';

interface ProfileSettingsProps {
  onClose?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose: _onClose }) => {
  const [settings, setSettings] = useState<ProfileSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getProfileSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof ProfileSettingsType) => {
    if (!settings) return;

    try {
      setSaving(true);
      const result = await api.updateProfileSettings({ [key]: !settings[key] });
      setSettings(result);
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Failed to load settings</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profile Settings
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.rememberProfilePerDomain}
                onChange={() => handleToggle('rememberProfilePerDomain')}
                disabled={saving}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Remember my profile per domain</Typography>
                <Typography variant="caption" color="text.secondary">
                  Automatically switch to the last used profile for each website
                </Typography>
              </Box>
            }
          />

          <Divider sx={{ my: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={settings.showProfileTips}
                onChange={() => handleToggle('showProfileTips')}
                disabled={saving}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Show profile tips</Typography>
                <Typography variant="caption" color="text.secondary">
                  Display helpful tips about using profiles
                </Typography>
              </Box>
            }
          />
        </FormGroup>
      </Paper>
    </Box>
  );
};
