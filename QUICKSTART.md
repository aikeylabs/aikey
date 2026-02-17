# Quick Start Guide - AiKey Extension M1

## Installation

### 1. Build the Extension

```bash
npm install
npm run build
```

The extension will be built to the `dist/` folder.

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The AiKey extension should now appear in your extensions list

### 3. Pin the Extension

- Click the puzzle piece icon in Chrome toolbar
- Find "AiKey - AI API Key Manager"
- Click the pin icon to keep it visible

## First Use

### Add Your First Key

1. Click the AiKey extension icon
2. You'll see the welcome screen
3. Click "Add my first key"
4. Fill in the form:
   - **Service**: Select your AI provider (OpenAI, Anthropic, etc.)
   - **API Key**: Paste your API key
   - **Name** (optional): Give it a custom name
   - **Tag/Project** (optional): Add a project tag
5. Click "Add Key"

### Use One-Click Fill

1. Navigate to a supported site:
   - platform.openai.com
   - console.anthropic.com
2. Go to the API keys settings page
3. Click the AiKey extension icon
4. Click on the key you want to fill
5. The key will be automatically filled into the input field

### Copy a Key

1. Click the AiKey extension icon
2. Find the key you want
3. Click the "Copy" button
4. The key is copied to your clipboard

## Features

### Profiles

- **Personal** and **Work** profiles are created by default
- Keys are organized by profile
- Switch profiles using the chip in the top bar (M3 feature)

### Search

- Use the search box to filter keys by:
  - Name
  - Service
  - Tag/Project

### Security

- All keys are encrypted using AES-256-GCM
- Keys are stored locally in IndexedDB
- Keys are NEVER uploaded to any server
- Device-bound encryption (keys tied to your browser)

## Development Mode

To run in development mode with hot reload:

```bash
npm run dev
```

Then load the `dist` folder in Chrome as described above. Changes will rebuild automatically.

## Troubleshooting

### Extension doesn't appear after loading

- Make sure you selected the `dist` folder, not the project root
- Check the Chrome extensions page for any error messages
- Try rebuilding: `npm run build`

### Fill doesn't work on a site

- Make sure you're on a supported site (OpenAI or Anthropic)
- Check that you're on the correct page (API settings)
- The extension needs permission for that domain

### Keys not saving

- Check browser console for errors (F12)
- Make sure IndexedDB is enabled in your browser
- Try clearing extension data and re-adding keys

## Next Steps (M2/M3)

Coming soon:
- Import keys from .env files
- Site memory (remember which key for which site)
- Custom profile creation
- Profile switching UI

## Support

For issues or questions, check the README.md or create an issue in the project repository.
