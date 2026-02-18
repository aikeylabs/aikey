import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ContentCopy,
} from '@mui/icons-material';
import { api } from '@/utils/messaging';
import type { KeyDisplay } from '../../types';

interface EditKeyDialogProps {
  keyData: KeyDisplay;
  onSave: (updatedKey: KeyDisplay) => void;
  onClose: () => void;
}

export function EditKeyDialog({ keyData, onSave, onClose }: EditKeyDialogProps) {
  const [name, setName] = useState(keyData.name || '');
  const [tag, setTag] = useState(keyData.tag || '');
  const [showFullKey, setShowFullKey] = useState(false);
  const [fullKeyValue, setFullKeyValue] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setName(keyData.name || '');
    setTag(keyData.tag || '');
  }, [keyData]);

  useEffect(() => {
    // Auto-hide full key after 5 seconds
    if (showFullKey) {
      hideTimerRef.current = window.setTimeout(() => {
        setShowFullKey(false);
        setFullKeyValue('');
      }, 5000);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [showFullKey]);

  const handleSave = () => {
    onSave({
      ...keyData,
      name: name.trim() || '',
      tag: tag.trim() || '',
    });
    onClose();
  };

  const handleToggleShowKey = async () => {
    if (!showFullKey && !fullKeyValue) {
      // Fetch the full key when showing for the first time
      setLoading(true);
      try {
        const decryptedKey = await api.decryptKey(keyData.id);
        setFullKeyValue(decryptedKey.apiKey);
        setShowFullKey(true);
      } catch (err) {
        console.error('Failed to decrypt key:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setShowFullKey(!showFullKey);
    }
  };

  const handleCopyFullKey = async () => {
    try {
      if (!fullKeyValue) {
        // Fetch the key if not already loaded
        setLoading(true);
        const decryptedKey = await api.decryptKey(keyData.id);
        await navigator.clipboard.writeText(decryptedKey.apiKey);
        setLoading(false);
      } else {
        await navigator.clipboard.writeText(fullKeyValue);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy key:', err);
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit API Key</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="Optional name for this key"
          />
          <TextField
            label="Tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            fullWidth
            placeholder="Optional tag (e.g., production, development)"
          />
          <TextField
            label="Service"
            value={keyData.service}
            disabled
            fullWidth
          />

          <Box>
            <TextField
              label="API Key"
              value={showFullKey ? fullKeyValue : keyData.keyPrefix}
              disabled
              fullWidth
              type={showFullKey ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleShowKey}
                      edge="end"
                      size="small"
                      title={showFullKey ? 'Hide key' : 'Show key'}
                      disabled={loading}
                    >
                      {showFullKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton
                      onClick={handleCopyFullKey}
                      edge="end"
                      size="small"
                      title="Copy full key"
                      disabled={loading}
                    >
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {showFullKey && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                Key will be hidden in 5 seconds
              </Typography>
            )}
            {copySuccess && (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                Copied to clipboard!
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
