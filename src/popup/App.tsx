import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import PopupSimple from './PopupSimple';
import ErrorBoundary from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E88E5',
    },
    secondary: {
      main: '#43A047',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiModal: {
      defaultProps: {
        // Prevent aria-hidden on root element
        disablePortal: false,
        keepMounted: false,
      },
    },
    MuiDialog: {
      defaultProps: {
        // Use a separate container for dialogs to avoid aria-hidden issues
        disablePortal: false,
      },
    },
  },
});

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// Create a separate container for Material-UI modals
const modalRoot = document.createElement('div');
modalRoot.id = 'modal-root';
document.body.appendChild(modalRoot);

ReactDOM.createRoot(root).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PopupSimple />
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
