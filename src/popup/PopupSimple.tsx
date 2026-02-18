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
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/messaging';
import type { KeyDisplay, Profile, ServiceType } from '@/types';
import AddKeyDialog from '@/components/AddKeyDialog';
import WelcomeScreen from '@/components/WelcomeScreen';
import EnvImportWizard from '@/components/EnvImportWizard';
import { EditKeyDialog } from './components/EditKeyDialog';
import { ProfileSelector } from '@/components/ProfileSelector';
import { ProfileManager } from '@/components/ProfileManager';
import { ServiceFilter } from '@/components/ServiceFilter';
import { siteAdapterManager } from '@/services/siteAdapter';


export default function Popup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType | 'All'>('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [editingKey, setEditingKey] = useState<KeyDisplay | null>(null);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<KeyDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [keys, setKeys] = useState<KeyDisplay[]>([]);
  const [recommendations, setRecommendations] = useState<KeyDisplay[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [currentSiteService, setCurrentSiteService] = useState<ServiceType | null>(null);
  const [fillSuccess, setFillSuccess] = useState<string | null>(null);
  const [fillError, setFillError] = useState<string | null>(null);

  // Initialize and load data
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function init() {
      try {
        console.log('Initializing extension...');

        // Initialize extension with retry logic
        while (retryCount < maxRetries) {
          try {
            await api.initExtension();
            console.log('Extension initialized');
            break;
          } catch (err: any) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw err;
            }
            console.log(`Initialization attempt ${retryCount} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

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
        const domain = url.hostname;
        setCurrentDomain(domain);

        // Detect if we're on a supported site
        const adapter = siteAdapterManager.findAdapter(domain);
        if (adapter) {
          setCurrentSiteService(adapter.service);
        }
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

  // Copy key mutation
  const copyKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const decryptedKey = await api.decryptKey(keyId);
      await navigator.clipboard.writeText(decryptedKey.apiKey);
      await api.logKeyUsage(keyId, currentDomain, 'copy');
    },
  });

  // Delete key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (keyId: string) => api.deleteKey(keyId),
    onSuccess: () => {
      // Reload keys after deletion
      if (profile) {
        api.getKeys(profile.id).then(setKeys).catch(console.error);
      }
    },
  });

  // Update key mutation
  const updateKeyMutation = useMutation({
    mutationFn: (key: any) => api.updateKey(key),
    onSuccess: () => {
      // Reload keys after update
      if (profile) {
        api.getKeys(profile.id).then(setKeys).catch(console.error);
      }
      setEditingKey(null);
    },
  });

  const handleCopyKey = (keyId: string) => {
    copyKeyMutation.mutate(keyId);
  };

  const handleDeleteKey = (key: KeyDisplay) => {
    setDeleteConfirmKey(key);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmKey) {
      deleteKeyMutation.mutate(deleteConfirmKey.id);
      setDeleteConfirmKey(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmKey(null);
  };

  const handleEditKey = (key: KeyDisplay) => {
    setEditingKey(key);
  };

  const handleSaveKey = (updatedKey: any) => {
    updateKeyMutation.mutate(updatedKey);
  };

  const handleFillKey = async (keyId: string, _keyName: string, service: ServiceType) => {
    if (!currentDomain) {
      setFillError('Could not detect current page');
      return;
    }

    // Check if we're on a supported site
    const adapter = siteAdapterManager.findAdapter(currentDomain);
    if (!adapter) {
      setFillError('This site is not supported for auto-fill. Use Copy instead.');
      return;
    }

    try {
      setFillSuccess(null);
      setFillError(null);

      await api.fillKey(keyId, currentDomain);

      // Show success message
      setFillSuccess(`Filled your ${service} key from ${profile?.name} profile.`);

      // Clear success message after 3 seconds
      setTimeout(() => setFillSuccess(null), 3000);
    } catch (error: any) {
      console.error('Fill error:', error);
      if (error.message.includes('Could not find')) {
        setFillError(`Couldn't find a key field on this page. Make sure you're on the API key settings page.`);
      } else {
        setFillError(error.message || 'Failed to fill key');
      }

      // Clear error after 5 seconds
      setTimeout(() => setFillError(null), 5000);
    }
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

  const handleProfileChange = async (newProfile: Profile) => {
    setProfile(newProfile);
    setLoading(true);
    try {
      const profileKeys = await api.getKeys(newProfile.id);
      setKeys(profileKeys || []);
    } catch (err) {
      console.error('Failed to load keys for profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileManagerClose = async () => {
    setShowProfileManager(false);
    // Reload current profile and keys
    try {
      const currentProfile = await api.getCurrentProfile();
      setProfile(currentProfile);
      if (currentProfile) {
        const profileKeys = await api.getKeys(currentProfile.id);
        setKeys(profileKeys || []);
      }
    } catch (err) {
      console.error('Failed to reload after profile management:', err);
    }
  };

  // Filter keys based on search, service filter, and current site
  const filteredKeys = keys.filter(
    (key: KeyDisplay) => {
      const matchesSearch =
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.keyPrefix.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesService = selectedService === 'All' || key.service === selectedService;

      // On supported sites, auto-filter by site's service unless user explicitly selected a different service
      const matchesSiteService = !currentSiteService || selectedService !== 'All' || key.service === currentSiteService;

      return matchesSearch && matchesService && matchesSiteService;
    }
  );

  // Check if we're on a supported site with no matching keys
  const onSupportedSite = currentSiteService !== null;
  const noKeysForSite = onSupportedSite && keys.length > 0 && filteredKeys.length === 0 && selectedService === 'All' && !searchQuery;

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
      {showProfileManager ? (
        <ProfileManager onClose={handleProfileManagerClose} />
      ) : (
        <>
          <AppBar position="static" elevation={1}>
            <Toolbar variant="dense">
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                AiKey
              </Typography>
              {profile && (
                <Box sx={{ mr: 1 }}>
                  <ProfileSelector
                    onProfileChange={handleProfileChange}
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

        <ServiceFilter
          selectedService={selectedService}
          onServiceChange={setSelectedService}
        />

        {fillSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFillSuccess(null)}>
            {fillSuccess}
          </Alert>
        )}

        {fillError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFillError(null)}>
            {fillError}
          </Alert>
        )}

        {onSupportedSite && currentSiteService && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing {currentSiteService} keys for this site
          </Alert>
        )}

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
                  onCopy={handleCopyKey}
                  onEdit={handleEditKey}
                  onDelete={handleDeleteKey}
                  onFill={onSupportedSite ? handleFillKey : undefined}
                  recommended
                />
              ))}
            </List>
          </Box>
        )}

        {filteredKeys.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {noKeysForSite ? (
              <>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, fontWeight: 500 }}>
                  No {currentSiteService} keys in {profile?.name} profile yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add a {currentSiteService} key to use one-click fill on this site.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddDialog(true)}
                >
                  Add an {currentSiteService} key
                </Button>
              </>
            ) : searchQuery || selectedService !== 'All' ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  No keys match your search
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedService('All');
                  }}
                >
                  Clear filters
                </Button>
              </>
            ) : keys.length === 0 ? (
              <>
                <Typography variant="body1" color="text.primary" sx={{ mb: 1, fontWeight: 500 }}>
                  No keys yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add your OpenAI, Anthropic, or Azure keys to see everything in one place.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddDialog(true)}
                >
                  Add my first key
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">
                No keys in this profile
              </Typography>
            )}
          </Box>
        ) : (
          <List>
            {filteredKeys.map((key: KeyDisplay) => (
              <KeyListItem
                key={key.id}
                keyItem={key}
                onCopy={handleCopyKey}
                onEdit={handleEditKey}
                onDelete={handleDeleteKey}
                onFill={onSupportedSite ? handleFillKey : undefined}
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
          sx={{ mb: 1 }}
        >
          Import from .env
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 1 }}
        >
          🔒 Keys are encrypted and stored locally on your device
        </Typography>
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

      {editingKey && (
        <EditKeyDialog
          keyData={editingKey}
          onSave={handleSaveKey}
          onClose={() => setEditingKey(null)}
        />
      )}

      {deleteConfirmKey && (
        <Dialog open={true} onClose={handleCancelDelete}>
          <DialogTitle>Delete this key?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This action cannot be undone. You will not be able to recover this key from AiKey.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
        </>
      )}
    </Box>
  );
}

// Helper function to get service logo/icon
function getServiceIcon(service: ServiceType): string {
  const icons: Record<ServiceType, string> = {
    'OpenAI': '🤖',
    'Anthropic': '🧠',
    'Azure OpenAI': '☁️',
    'Groq': '⚡',
    'Custom': '🔧',
  };
  return icons[service] || '🔑';
}

// Helper function to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

interface KeyListItemProps {
  keyItem: KeyDisplay;
  onCopy: (keyId: string) => void;
  onEdit: (key: KeyDisplay) => void;
  onDelete: (key: KeyDisplay) => void;
  onFill?: (keyId: string, keyName: string, service: ServiceType) => void;
  recommended?: boolean;
}

function KeyListItem({ keyItem, onCopy, onEdit, onDelete, onFill, recommended }: KeyListItemProps) {
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
      <ListItemButton
        onClick={() => onEdit(keyItem)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'background.default',
            fontSize: '1.2rem',
          }}
        >
          {getServiceIcon(keyItem.service)}
        </Avatar>
        <ListItemText
          primary={keyItem.name}
          secondary={
            <>
              {keyItem.service} • {keyItem.keyPrefix}
              {keyItem.tag && ` • ${keyItem.tag}`}
              {keyItem.updatedAt && ` • ${formatRelativeTime(keyItem.updatedAt)}`}
            </>
          }
          sx={{ flexGrow: 1, minWidth: 0 }}
        />
      </ListItemButton>
      {onFill && (
        <Button
          size="small"
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            onFill(keyItem.id, keyItem.name, keyItem.service);
          }}
          sx={{ mr: 1 }}
        >
          Fill
        </Button>
      )}
      <Button
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onCopy(keyItem.id);
        }}
        sx={{ mr: 1 }}
      >
        Copy
      </Button>
      <Button
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(keyItem);
        }}
        sx={{ mr: 1 }}
      >
        Edit
      </Button>
      <Button
        size="small"
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(keyItem);
        }}
        sx={{ mr: 1 }}
      >
        Delete
      </Button>
    </ListItem>
  );
}
