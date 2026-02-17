# AiKey Extension Testing Guide

## Quick Test Checklist

### 1. Reload Extension
1. Open Chrome and go to `chrome://extensions/`
2. Find "AiKey Labs Extension"
3. Click the reload icon 🔄
4. Check that no errors appear

### 2. Test Profile System
1. Click the AiKey extension icon in your toolbar
2. **Expected:** You should see a profile chip at the top showing "Personal" (blue) or "Work" (green)
3. **If you don't see it:** Open DevTools Console (F12) and check for errors

### 3. Test Adding a Key
1. Click "Add API Key" button
2. Fill in:
   - Service: OpenAI
   - API Key: `sk-test-1234567890abcdef`
   - Name: Test Key
   - Tag: Testing (optional)
3. Click "Add Key"
4. **Expected:** Key appears in the list with the service icon

### 4. Test Site Adapter System
**Option A: Use Test Page**
1. Open `test-page.html` in Chrome (drag file into browser)
2. Click AiKey extension icon
3. Click on your test key
4. **Expected:** The key fills into the password field on the test page

**Option B: Use Real Sites**
1. Go to `https://platform.openai.com` (OpenAI)
2. Navigate to API keys section
3. Click AiKey extension
4. **Expected:** Extension shows "Recommended for this site" section
5. Click a key to fill it

### 5. Test Copy Functionality
1. Open AiKey extension
2. Click "Copy" button on any key
3. Paste somewhere (Cmd/Ctrl+V)
4. **Expected:** The decrypted API key is copied to clipboard

### 6. Test Search
1. Add multiple keys with different names
2. Type in the search box
3. **Expected:** Keys filter in real-time

## Debugging

### Check Background Service Worker
1. Go to `chrome://extensions/`
2. Click "service worker" link under AiKey
3. Look for these logs:
   ```
   AiKey extension installed
   AiKey initialized successfully
   Profiles: [Array with Personal and Work profiles]
   Current profile ID: [some UUID]
   ```

### Check Storage
In the service worker console, run:
```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

You should see:
- `profiles`: Array with Personal and Work profiles
- `metadata`: Object with currentProfile ID
- `keys_[profileId]`: Arrays of encrypted keys

### Common Issues

**Issue: No profile chip showing**
- Check service worker console for initialization errors
- Verify profiles were created: `chrome.storage.local.get('profiles', console.log)`

**Issue: Fill not working**
- Check that you're on a supported site (platform.openai.com or console.anthropic.com)
- Check content script is injected: Look for "AiKey content script loaded" in page console
- Verify the input field exists on the page

**Issue: Keys not saving**
- Check service worker console for encryption errors
- Verify storage permissions in manifest.json

## Supported Sites

Currently supported:
- ✅ platform.openai.com (OpenAI Platform)
- ✅ console.anthropic.com (Anthropic Console)

To add more sites, edit `src/services/siteAdapter.ts`

## Next Steps

If all tests pass:
1. ✅ Profile system is working
2. ✅ Site adapter system is working
3. ✅ Encryption/decryption is working
4. ✅ Storage is working

If tests fail, check the debugging section above and look for error messages in:
- Extension service worker console
- Browser page console (F12)
- Extension popup console (right-click popup → Inspect)
