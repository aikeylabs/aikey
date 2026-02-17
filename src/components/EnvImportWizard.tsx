import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { ServiceType } from '@/types';
import {
  parseEnvFile,
  filterApiKeys,
  detectServiceFromKey,
  detectServiceFromValue,
  generateNameFromKey,
  type EnvKeyEntry,
} from '@/utils/envParser';

interface ImportKeyData {
  entry: EnvKeyEntry;
  selected: boolean;
  name: string;
  service: ServiceType;
  tags: string[];
}

interface EnvImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImport: (keys: Array<{ name: string; value: string; service: ServiceType; tags: string[] }>) => Promise<void>;
}

const STEPS = ['Upload File', 'Review Keys', 'Confirm Import'];

export default function EnvImportWizard({ open, onClose, onImport }: EnvImportWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [fileContent, setFileContent] = useState('');
  const [importKeys, setImportKeys] = useState<ImportKeyData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      processEnvFile(content);
    };
    reader.readAsText(file);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const content = event.clipboardData.getData('text');
    setFileContent(content);
    processEnvFile(content);
  };

  const processEnvFile = (content: string) => {
    const parsed = parseEnvFile(content);
    const apiKeys = filterApiKeys(parsed.entries);

    if (apiKeys.length === 0) {
      setErrors(['No API keys found in the file. Make sure your .env file contains valid API key entries.']);
      return;
    }

    const importData: ImportKeyData[] = apiKeys.map(entry => {
      const serviceFromKey = detectServiceFromKey(entry.key);
      const serviceFromValue = detectServiceFromValue(entry.value);
      const detectedService = serviceFromKey || serviceFromValue || 'OpenAI';

      return {
        entry,
        selected: true,
        name: generateNameFromKey(entry.key),
        service: detectedService as ServiceType,
        tags: ['imported'],
      };
    });

    setImportKeys(importData);
    setErrors(parsed.errors.map(e => `Line ${e.line}: ${e.message}`));
    setActiveStep(1);
  };

  const handleToggleKey = (index: number) => {
    setImportKeys(prev =>
      prev.map((key, i) =>
        i === index ? { ...key, selected: !key.selected } : key
      )
    );
  };

  const handleUpdateKey = (index: number, field: keyof ImportKeyData, value: any) => {
    setImportKeys(prev =>
      prev.map((key, i) =>
        i === index ? { ...key, [field]: value } : key
      )
    );
  };

  const handleNext = () => {
    if (activeStep === 1) {
      const selectedCount = importKeys.filter(k => k.selected).length;
      if (selectedCount === 0) {
        setErrors(['Please select at least one key to import.']);
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const selectedKeys = importKeys
        .filter(k => k.selected)
        .map(k => ({
          name: k.name,
          value: k.entry.value,
          service: k.service,
          tags: k.tags,
        }));

      await onImport(selectedKeys);
      handleClose();
    } catch (error: any) {
      setErrors([error.message || 'Failed to import keys']);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFileContent('');
    setImportKeys([]);
    setErrors([]);
    setImporting(false);
    onClose();
  };

  const selectedCount = importKeys.filter(k => k.selected).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import from .env File</DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </Alert>
        )}

        {/* Step 1: Upload File */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload your .env file or paste its contents below. We'll automatically detect API keys.
            </Typography>

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Choose .env File
              <input
                type="file"
                hidden
                accept=".env,.env.local,.env.production"
                onChange={handleFileUpload}
              />
            </Button>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              or
            </Typography>

            <TextField
              multiline
              rows={12}
              fullWidth
              placeholder="Paste your .env file contents here...&#10;&#10;Example:&#10;OPENAI_API_KEY=sk-...&#10;ANTHROPIC_API_KEY=sk-ant-..."
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              onPaste={handlePaste}
            />
          </Box>
        )}

        {/* Step 2: Review Keys */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Found {importKeys.length} API key{importKeys.length !== 1 ? 's' : ''}. Review and customize before importing.
            </Typography>

            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {importKeys.map((keyData, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <Checkbox
                      checked={keyData.selected}
                      onChange={() => handleToggleKey(index)}
                    />
                    <ListItemText
                      primary={keyData.entry.key}
                      secondary={`Line ${keyData.entry.lineNumber}${keyData.entry.comment ? ` - ${keyData.entry.comment}` : ''}`}
                    />
                  </Box>

                  {keyData.selected && (
                    <Box sx={{ pl: 7, pr: 2, pb: 1 }}>
                      <TextField
                        label="Display Name"
                        size="small"
                        fullWidth
                        value={keyData.name}
                        onChange={(e) => handleUpdateKey(index, 'name', e.target.value)}
                        sx={{ mb: 1 }}
                      />

                      <FormControl size="small" fullWidth>
                        <InputLabel>Service</InputLabel>
                        <Select
                          value={keyData.service}
                          label="Service"
                          onChange={(e) => handleUpdateKey(index, 'service', e.target.value)}
                        >
                          <MenuItem value="OpenAI">OpenAI</MenuItem>
                          <MenuItem value="Anthropic">Anthropic</MenuItem>
                          <MenuItem value="Azure">Azure OpenAI</MenuItem>
                          <MenuItem value="Google">Google AI</MenuItem>
                          <MenuItem value="Cohere">Cohere</MenuItem>
                          <MenuItem value="Hugging Face">Hugging Face</MenuItem>
                        </Select>
                      </FormControl>

                      <Box sx={{ mt: 1 }}>
                        <Chip label="imported" size="small" />
                      </Box>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Step 3: Confirm Import */}
        {activeStep === 2 && (
          <Box>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ready to Import
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCount} key{selectedCount !== 1 ? 's' : ''} will be added to your vault
              </Typography>
            </Box>

            <List>
              {importKeys.filter(k => k.selected).map((keyData, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={keyData.name}
                    secondary={`${keyData.service} - ${keyData.entry.key}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={importing}>
            Back
          </Button>
        )}
        {activeStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={activeStep === 0 && !fileContent}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={importing || selectedCount === 0}
          >
            {importing ? 'Importing...' : `Import ${selectedCount} Key${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
