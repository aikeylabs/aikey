# Troubleshooting Guide

## Common Issues and Fixes

### Issue: React Error #185 on Extension Load

**Symptoms:**
- Extension loads but shows blank screen
- Console shows "Minified React error #185"
- Background script may not be initializing

**Causes:**
1. Background service worker not initialized before popup opens
2. Chrome API not available when popup loads
3. React Query trying to fetch before extension is ready

**Fixes Applied (v0.1.1):**

1. **Added Error Boundary** (`src/components/ErrorBoundary.tsx`)
   - Catches React errors and shows user-friendly message
   - Provides reload button

2. **Added Initialization Check** (`src/popup/Popup.tsx`)
   - Calls `api.initExtension()` on mount
   - Shows loading spinner while initializing
   - Displays error messages if initialization fails

3. **Improved Message Handling** (`src/utils/messaging.ts`)
   - Checks if `chrome.runtime` is available
   - Better error messages
   - Handles missing responses

4. **Added Retry Logic** (React Query config)
   - Retries failed queries 1-3 times
   - Adds delay between retries
   - Sets staleTime to prevent excessive refetching

**How to Fix:**

1. **Reload the extension:**
   ```
   1. Go to chrome://extensions/
   2. Click the reload icon on AiKey extension
   3. Close and reopen the popup
   ```

2. **Check background script:**
   ```
   1. Go to chrome://extensions/
   2. Click "service worker" link under AiKey
   3. Check console for errors
   4. Look for "AiKey initialized successfully"
   ```

3. **Clear extension data:**
   ```
   1. Right-click extension icon
   2. Inspect popup
   3. Go to Application → Storage
   4. Click "Clear site data"
   5. Reload extension
   ```

4. **Rebuild from source:**
   ```bash
   npm run build
   # Reload extension in Chrome
   ```

### Issue: "Chrome runtime not available"

**Cause:** Extension context is invalid or popup opened too quickly

**Fix:**
- Reload the extension
- Wait 1-2 seconds after loading before opening popup
- Check that extension is enabled

### Issue: "No response from background script"

**Cause:** Background service worker crashed or not running

**Fix:**
1. Check service worker status in chrome://extensions/
2. Click "service worker" to see console
3. Look for initialization errors
4. Reload extension

### Issue: Keys not persisting

**Cause:** IndexedDB not initialized or quota exceeded

**Fix:**
1. Check browser console for IndexedDB errors
2. Clear browser data if quota exceeded
3. Ensure IndexedDB is enabled in browser settings

### Issue: Fill not working on sites

**Cause:** Content script not injected or site structure changed

**Fix:**
1. Reload the page where you want to fill
2. Check that site is in supported list (OpenAI, Anthropic)
3. Verify extension has permission for that domain
4. Check console for content script errors

## Debug Mode

To see detailed logs:

1. Open extension popup
2. Right-click → Inspect
3. Go to Console tab
4. Look for:
   - "AiKey extension installed"
   - "AiKey initialized successfully"
   - Any error messages

## Getting Help

If issues persist:

1. Check console for errors (F12)
2. Note the exact error message
3. Check which version you're running
4. Try in a fresh Chrome profile
5. Report issue with:
   - Error message
   - Steps to reproduce
   - Chrome version
   - Extension version

## Version History

### v0.1.1 (Current)
- Added error boundary
- Improved initialization
- Better error messages
- Loading states

### v0.1.0 (Initial)
- Basic functionality
- May have initialization issues
