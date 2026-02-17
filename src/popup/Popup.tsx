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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/messaging';
import { useAppStore } from '@/stores/appStore';
import type { KeyDisplay } from '@/types';
import AddKeyDialog from '@/components/AddKeyDialog';
import WelcomeScreen from '@/components/WelcomeScreen';
import { ProfileSelector, ProfileManager } from '@/components';

export default function Popup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { setCurrentProfile, setKeys } = useAppStore();

  // Initialize extension on mount
  useEffect(() => {
    console.log('Popup mounted, initializing extension...');
    api.initExtension()
      .then(() => {
        console.log('Extension initialized successfully');
      })
      .catch((err) => {
        console.error('Failed to initialize extension:', err);
        setInitError(err.message);
      });
  }, []);

  // Fetch current profile
  const { data: profile, error: profileError } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      console.log('Fetching current profile...');
      const result = await api.getCurrentProfile();
      console.log('Current profile:', result);
      return result;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch keys for current profile
  const { data: keys = [], isLoading, error } = useQuery({
    queryKey: ['keys', profile?.id],
    queryFn: async () => {
      console.log('Fetching keys for profile:', profile?.id);
      const result = await api.getKeys(profile?.id);
      console.log('Keys fetched:', result?.length);
      return result;
    },
    enabled: !!profile,
    retry: 2,
  });

  // Get current domain for recommendations
  const [currentDomain, setCurrentDomain] = useState<string>('');

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentDomain(url.hostname);
      }
    });
  }, []);

  // Fetch site recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations', currentDomain, profile?.id],
    queryFn: () => api.getSiteRecommendations(currentDomain, profile!.id),
    enabled: !!currentDomain && !!profile,
  });

  useEffect(() => {
    if (profile) {
      setCurrentProfile(profile);
    }
  }, [profile, setCurrentProfile]);

  useEffect(() => {
    setKeys(keys);
  }, [keys, setKeys]);

  // Check if this is first run
  useEffect(() => {
    if (keys.length === 0 && !isLoading) {
      setShowWelcome(true);
    }
  }, [keys, isLoading]);

  // Fill key mutation
  const fillKeyMutation = useMutation({
    mutationFn: (keyId: string) => api.fillKey(keyId, currentDomain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
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

  const filteredKeys = keys.filter(
    (key: KeyDisplay) =>
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Show loading while profile is being fetched
  if (!profile && !profileError && !initError) {
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

  return (
    <Box sx={{ width: 400, height: 600, display: 'flex', flexDirection: 'column' }}>
      {initError && (
        <Alert severity="error" sx={{ m: 2 }}>
          Initialization error: {initError}
        </Alert>
      )}

      {profileError && (
        <Alert severity="error" sx={{ m: 2 }}>
          Profile error: {(profileError as Error).message}
        </Alert>
      )}

      <AppBar position="static" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AiKey
          </Typography>
          {profile && (
            <Box sx={{ mr: 1 }}>
              <ProfileSelector
                onProfileChange={(newProfile) => {
                  setCurrentProfile(newProfile);
                  queryClient.invalidateQueries({ queryKey: ['keys'] });
                }}
                onManageClick={() => setShowProfileManager(true)}
              />
            </Box>
          )}
          <IconButton color="inherit" size="small">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as Error).message}
          </Alert>
        )}

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

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredKeys.length === 0 ? (
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
        >
          Add API Key
        </Button>
      </Box>

      <AddKeyDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        currentProfile={profile}
      />

      <Dialog
        open={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        maxWidth="md"
        fullWidth
      >
        <ProfileManager
          onClose={() => {
            setShowProfileManager(false);
            queryClient.invalidateQueries({ queryKey: ['currentProfile'] });
            queryClient.invalidateQueries({ queryKey: ['keys'] });
          }}
        />
      </Dialog>
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
