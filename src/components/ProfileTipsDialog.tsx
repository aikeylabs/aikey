import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { sendMessage } from '../utils/messaging';
import { MessageType } from '../types/messages';

interface ProfileTipsDialogProps {
  open: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

export const ProfileTipsDialog: React.FC<ProfileTipsDialogProps> = ({
  open,
  onClose,
  onDismiss,
}) => {
  const handleDismiss = async () => {
    // Update settings to hide tips permanently
    await sendMessage(MessageType.UPDATE_SETTINGS, {
      showProfileTips: false,
    });
    onDismiss();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Lightbulb color="primary" />
          <Typography variant="h6">Profile Tips</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          You now have multiple profiles! Here's how to make the most of them:
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Use profiles to separate personal, work, client, and dev/prod environments.
          Each profile has its own set of API keys, making it easy to switch contexts
          without mixing credentials.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enable "Remember my profile per domain" in settings to automatically switch
          to the correct profile for each website.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Remind me later</Button>
        <Button onClick={handleDismiss} variant="contained">
          Got it, don't show again
        </Button>
      </DialogActions>
    </Dialog>
  );
};
