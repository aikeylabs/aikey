import { useEffect, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/messaging';
import type { KeyDisplay, Profile } from '@/types';
import AddKeyDialog from '@/components/AddKeyDialog';
import WelcomeScreen from '@/components/WelcomeScreen';
import EnvImportWizard from '@/components/EnvImportWizard';

export default function Popup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [keys, setKeys] = useState<KeyDisplay[]>([]);
  const [recommendations, setRecommendations] = useState<KeyDisplay[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string>('');

  // Initialize and load data
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        console.log('Initializing extension...');

        // Initialize extension
        await api.initExtension();
        console.log('Extension initialized');

        if (!mounted) return;

        // Get current profile
        const currentProfile = await api.getCurrentProfile();
        console.log('Current profile:', currentProfile);

        if (!mounted) return;
        setProfile(currentProfile);

        // Get keys for profile
        const profileKeys = await api.getKeys(currentProfile?.id);
        console.log('Keys loaded:', profileKeys?.length);

        if (!mounted) return;
        setKeys(profileKeys || []);

        // Check if should show welcome
        if (!profileKeys || profileKeys.length === 0) {
          setShowWelcome(true);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Initialization error:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Get current domain for recommendations
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentDomain(url.hostname);
      }
    });
  }, []);

  // Load recommendations when domain and profile are available
  useEffect(() => {
    if (currentDomain && profile) {
      api.getSiteRecommendations(currentDomain, profile.id)
        .then(setRecommendations)
        .catch(console.error);
    }
  }, [currentDomain, profile]);

  // Fill key mutation
  const fillKeyMutation = useMutation({
    mutationFn: (keyId: string) => api.fillKey(keyId, currentDomain),
    onSuccess: () => {
      // Reload keys
      if (profile) {
        api.getKeys(profile.id).then(setKeys).catch(console.error);
      }
    },
  });

  // Copy key mutation
  const copyKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const decryptedKey = await api.decryptKey(keyId);
      await navigator.clipboard.writeText(decryptedKey.apiKey);
      await api.logKeyUsage(keyId, currentDomain, 'copy');
    },
  });

  const handleFillKey = (keyId: string) => {
    fillKeyMutation.mutate(keyId);
  };

  const handleCopyKey = (keyId: string) => {
    copyKeyMutation.mutate(keyId);
  };

  const handleKeyAdded = () => {
    // Reload keys after adding
    if (profile) {
      setLoading(true);
      api.getKeys(profile.id)
        .then((newKeys) => {
          setKeys(newKeys || []);
          setShowWelcome(false);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to reload keys:', err);
          setLoading(false);
        });
    }
  };

  const handleImportKeys = async (importedKeys: Array<{ name: string; value: string; service: any; tags: string[] }>) => {
    if (!profile) return;

    for (const key of importedKeys) {
      await api.addKey({
        name: key.name,
        apiKey: key.value,
        service: key.service,
        profileId: profile.id,
        tag: key.tags[0] || 'imported',
      });
    }

    // Reload keys
    handleKeyAdded();
  };

  const filteredKeys = keys.filter(
    (key: KeyDisplay) =>
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box
        sx={{
          width: 400,
          height: 600,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: 400, height: 600, p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          fullWidth
          onClick={() => window.location.reload()}
        >
          Reload Extension
        </Button>
      </Box>
    );
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        onAddKey={() => {
          setShowWelcome(false);
          setShowAddDialog(true);
        }}
        onExplore={() => setShowWelcome(false)}
      />
    );
  }

  return (
    <Box sx={{ width: 400, height: 600, display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AiKey
          </Typography>
          {profile && (
            <Chip
              label={profile.name}
              size="small"
              sx={{
                bgcolor: profile.color || '#1E88E5',
                color: 'white',
                mr: 1,
              }}
            />
          )}
          <IconButton color="inherit" size="small">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search keys..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {recommendations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Recommended for this site
            </Typography>
            <List dense>
              {recommendations.map((key: KeyDisplay) => (
                <KeyListItem
                  key={key.id}
                  keyItem={key}
                  onFill={handleFillKey}
                  onCopy={handleCopyKey}
                  recommended
                />
              ))}
            </List>
          </Box>
        )}

        {filteredKeys.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {searchQuery ? 'No keys match your search' : 'No keys yet'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredKeys.map((key: KeyDisplay) => (
              <KeyListItem
                key={key.id}
                keyItem={key}
                onFill={handleFillKey}
                onCopy={handleCopyKey}
              />
            ))}
          </List>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
          sx={{ mb: 1 }}
        >
          Add API Key
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setShowImportWizard(true)}
        >
          Import from .env
        </Button>
      </Box>

      <AddKeyDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          handleKeyAdded();
        }}
        currentProfile={profile}
      />

      <EnvImportWizard
        open={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        onImport={handleImportKeys}
      />
    </Box>
  );
}

interface KeyListItemProps {
  keyItem: KeyDisplay;
  onFill: (keyId: string) => void;
  onCopy: (keyId: string) => void;
  recommended?: boolean;
}

function KeyListItem({ keyItem, onFill, onCopy, recommended }: KeyListItemProps) {
  return (
    <ListItem
      disablePadding
      sx={{
        mb: 1,
        border: 1,
        borderColor: recommended ? 'primary.main' : 'divider',
        borderRadius: 1,
        bgcolor: recommended ? 'primary.50' : 'background.paper',
      }}
    >
      <ListItemButton onClick={() => onFill(keyItem.id)}>
        <ListItemText
          primary={keyItem.name}
          secondary={
            <>
              {keyItem.service} • {keyItem.keyPrefix}
              {keyItem.tag && ` • ${keyItem.tag}`}
            </>
          }
        />
      </ListItemButton>
      <Button size="small" onClick={() => onCopy(keyItem.id)} sx={{ mr: 1 }}>
        Copy
      </Button>
    </ListItem>
  );
}
