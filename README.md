# AiKey Browser Extension

AI API Key Manager browser extension built with React, TypeScript, and Manifest V3.

**Current Version**: 0.1.1 (M2 Complete)

## Features

### M1 Foundation ✅
- ✅ Local encrypted key vault (AES-256-GCM)
- ✅ Manual key addition with service selection
- ✅ Basic profile support (Personal / Work)
- ✅ One-click fill on supported sites (OpenAI, Anthropic)
- ✅ Key list with search
- ✅ Welcome screen for first-time users
- ✅ Usage logging (local only)

### M2 Enhancement ✅
- ✅ .env file import wizard with smart detection
- ✅ Auto-detect service types from key names/values
- ✅ Site binding system (domain → key memory)
- ✅ Site-based key recommendations
- ✅ Enhanced usage logging with domain tracking
- ✅ Batch import functionality
- ✅ Profile-aware recommendations

## Tech Stack

- **Manifest V3** - Modern Chrome extension standard
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Design system
- **Zustand** - State management
- **React Query** - Async state management
- **Vite + CRXJS** - Build system
- **IndexedDB** - Local storage
- **Web Crypto API** - Encryption

## Project Structure

```
src/
├── background/       # Service worker
├── content/          # Content scripts for site filling
├── popup/            # Extension popup UI
├── components/       # React components
│   ├── AddKeyDialog.tsx
│   ├── EnvImportWizard.tsx  # M2: .env import wizard
│   └── WelcomeScreen.tsx
├── services/         # Core services (encryption, storage, adapters)
├── stores/           # Zustand stores
├── types/            # TypeScript types
└── utils/            # Utility functions
    ├── envParser.ts  # M2: .env parsing utilities
    └── messaging.ts
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder from this project

### Build for Production

```bash
npm run build
```

The built extension will be in the `dist` folder.

## Architecture

### Encryption

- Device-bound encryption using PBKDF2 + AES-256-GCM
- Keys encrypted at rest in IndexedDB
- Master key derived from browser fingerprint
- Unique IV per encryption operation

### Storage

- IndexedDB for structured data
- Separate stores for keys, profiles, bindings (M2), logs
- Indexed queries for performance
- Site bindings for domain-based recommendations (M2)

### Messaging

- Chrome runtime messaging between popup ↔ background ↔ content
- Type-safe message protocol
- Request-response pattern with unique IDs

### Site Adapters

- Extensible adapter system for different AI websites
- Selector-based field detection
- Custom hooks for before/after fill

## Security

- Keys stored locally, never uploaded to servers
- Application-layer encryption
- No plaintext keys in storage
- Usage logs contain no request content
- CSP headers for XSS protection

## Supported Sites

- platform.openai.com
- console.anthropic.com
- More coming soon...

## Quick Start

### Import Keys from .env

1. Click "Import from .env" button in popup
2. Upload your .env file or paste content
3. Review auto-detected keys and services
4. Customize names if needed
5. Click "Import" - done!

### Use Site Recommendations

1. Visit a website (e.g., platform.openai.com)
2. Open AiKey popup and fill a key
3. Next time you visit, that key will be recommended
4. One-click fill with recommended keys

## Documentation

- [M2 Summary](./M2_SUMMARY.md) - M2 features overview
- [M2 Testing Guide](./M2_TESTING_GUIDE.md) - How to test M2 features
- [Phase 2 Status](./PHASE_2_STATUS.md) - Detailed implementation status

## Roadmap

- ✅ **M1**: Foundation (encryption, basic UI, manual key entry)
- ✅ **M2**: Enhancement (.env import, site memory, recommendations)
- 🚧 **M3**: Maturity (full profile management, multi-identity switching)
- 📋 **M4**: Advanced features (sync, sharing, team management)

## License

ISC
