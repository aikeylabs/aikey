import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/messaging';
import type { Profile, ServiceType } from '@/types';

interface AddKeyDialogProps {
  open: boolean;
  onClose: () => void;
  currentProfile: Profile | null;
}

const SERVICES: ServiceType[] = ['OpenAI', 'Anthropic', 'Azure OpenAI', 'Groq', 'Custom'];

export default function AddKeyDialog({ open, onClose, currentProfile }: AddKeyDialogProps) {
  const [service, setService] = useState<ServiceType>('OpenAI');
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [touched, setTouched] = useState(false);

  const queryClient = useQueryClient();

  const addKeyMutation = useMutation({
    mutationFn: api.addKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleClose = () => {
    setService('OpenAI');
    setApiKey('');
    setName('');
    setTag('');
    setError('');
    setApiKeyError('');
    setTouched(false);
    onClose();
  };

  const validateApiKey = (value: string): string => {
    if (!value.trim()) {
      return 'API key is required';
    }
    if (value.trim().length < 20) {
      return 'API key must be at least 20 characters';
    }
    return '';
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (touched) {
      setApiKeyError(validateApiKey(value));
    }
  };

  const handleApiKeyBlur = () => {
    setTouched(true);
    setApiKeyError(validateApiKey(apiKey));
  };

  const handleSubmit = () => {
    setTouched(true);
    const validationError = validateApiKey(apiKey);

    if (validationError) {
      setApiKeyError(validationError);
      return;
    }

    addKeyMutation.mutate({
      service,
      apiKey: apiKey.trim(),
      name: name.trim() || undefined,
      tag: tag.trim() || undefined,
      profileId: currentProfile?.id,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      container={() => document.getElementById('modal-root') || document.body}
      disablePortal={false}
    >
      <DialogTitle>Add API Key</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="service-select-label">Service</InputLabel>
            <Select
              labelId="service-select-label"
              id="service-select"
              value={service}
              label="Service"
              onChange={(e) => setService(e.target.value as ServiceType)}
            >
              {SERVICES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="API Key *"
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            onBlur={handleApiKeyBlur}
            required
            error={!!apiKeyError}
            sx={{ mb: 2 }}
            helperText={apiKeyError || "Your key will be encrypted and stored locally"}
          />

          <TextField
            fullWidth
            label="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            placeholder={`${service} - ${currentProfile?.name || 'Personal'}`}
          />

          <TextField
            fullWidth
            label="Tag / Project (optional)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" color="text.secondary">
            Current profile: {currentProfile?.name || 'Personal'}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            This key will be added to your {currentProfile?.name || 'Personal'} profile.
          </Typography>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              🔒 Your keys are stored locally on this device and encrypted. We never upload
              your API keys to any server.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={addKeyMutation.isPending}
        >
          {addKeyMutation.isPending ? 'Adding...' : 'Add Key'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
