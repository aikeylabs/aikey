import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import type { KeyDisplay } from '../../types';

interface EditKeyDialogProps {
  keyData: KeyDisplay;
  onSave: (updatedKey: KeyDisplay) => void;
  onClose: () => void;
}

export function EditKeyDialog({ keyData, onSave, onClose }: EditKeyDialogProps) {
  const [name, setName] = useState(keyData.name || '');
  const [tag, setTag] = useState(keyData.tag || '');

  useEffect(() => {
    setName(keyData.name || '');
    setTag(keyData.tag || '');
  }, [keyData]);

  const handleSave = () => {
    onSave({
      ...keyData,
      name: name.trim() || '',
      tag: tag.trim() || '',
    });
    onClose();
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
