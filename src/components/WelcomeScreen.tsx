import { Box, Typography, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';

interface WelcomeScreenProps {
  onAddKey: () => void;
  onExplore: () => void;
}

export default function WelcomeScreen({ onAddKey, onExplore }: WelcomeScreenProps) {
  return (
    <Box
      sx={{
        width: 400,
        height: 600,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 4,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Too many AI API keys?
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Store them once in AiKey. Fill them anywhere in one click.
      </Typography>

      <List sx={{ mb: 4, width: '100%' }}>
        <ListItem>
          <ListItemIcon>
            <CheckIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Using OpenAI, Anthropic, Azure or others?"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <CheckIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Copy-pasting keys into many tools?"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <CheckIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Managing personal / work / client keys?"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      </List>

      <Button variant="contained" fullWidth onClick={onAddKey} sx={{ mb: 2 }}>
        Add my first key
      </Button>

      <Button variant="outlined" fullWidth onClick={onExplore}>
        Explore my empty vault
      </Button>
    </Box>
  );
}
