# M1 Testing Checklist

## Pre-Testing Setup

- [ ] Build the extension: `npm run build`
- [ ] Load extension in Chrome from `dist/` folder
- [ ] Pin extension to toolbar for easy access
- [ ] Have test API keys ready (or use dummy keys for testing)

## 1. First-Run Experience

### Welcome Screen
- [ ] Open extension for the first time
- [ ] Verify welcome screen appears
- [ ] Check all three bullet points are visible
- [ ] Click "Add my first key" → opens add key dialog
- [ ] Close dialog, click "Explore my empty vault" → shows empty key list

## 2. Add Key Functionality

### Basic Add
- [ ] Click "Add API Key" button
- [ ] Select service: OpenAI
- [ ] Enter API key (test: `sk-test123456789`)
- [ ] Leave name and tag empty
- [ ] Verify default name is "OpenAI - Personal"
- [ ] Click "Add Key"
- [ ] Verify key appears in list
- [ ] Verify key shows as `sk-****` (partial display)

### Add with Custom Fields
- [ ] Add another key
- [ ] Select service: Anthropic
- [ ] Enter API key (test: `sk-ant-test123`)
- [ ] Enter custom name: "My Anthropic Key"
- [ ] Enter tag: "Project Alpha"
- [ ] Click "Add Key"
- [ ] Verify custom name and tag appear in list

### Validation
- [ ] Try to add key without API key → shows error
- [ ] Verify security message is visible in dialog

## 3. Key List & Search

### List Display
- [ ] Verify all added keys are visible
- [ ] Check service logos/names are correct
- [ ] Check key prefixes are correct (sk-****)
- [ ] Check tags are displayed

### Search
- [ ] Type key name in search box → filters correctly
- [ ] Type service name → filters correctly
- [ ] Type tag name → filters correctly
- [ ] Clear search → shows all keys again
- [ ] Search with no matches → shows "No keys match your search"

## 4. Profile System

### Profile Indicator
- [ ] Verify "Personal" chip is visible in top bar
- [ ] Check chip color is blue (#1E88E5)

### Profile Filtering
- [ ] All keys should be in "Personal" profile by default
- [ ] (M3 feature: profile switching not yet implemented)

## 5. Copy Functionality

### Copy Key
- [ ] Click "Copy" button on a key
- [ ] Paste somewhere → verify full key is copied
- [ ] Check that key is not revealed in UI (still shows sk-****)

### Copy Multiple
- [ ] Copy different keys
- [ ] Verify each copy works correctly

## 6. One-Click Fill (OpenAI)

### Setup
- [ ] Navigate to https://platform.openai.com
- [ ] Go to API keys settings page
- [ ] Find the "Create new secret key" or API key input field

### Fill Test
- [ ] Click AiKey extension icon
- [ ] Click on an OpenAI key in the list
- [ ] Verify key is filled into the input field
- [ ] Verify success notification appears
- [ ] Check notification disappears after 3 seconds

### Error Cases
- [ ] Try filling on a page without API key input
- [ ] Verify error message appears

## 7. One-Click Fill (Anthropic)

### Setup
- [ ] Navigate to https://console.anthropic.com
- [ ] Go to API keys settings page

### Fill Test
- [ ] Click AiKey extension icon
- [ ] Click on an Anthropic key
- [ ] Verify key is filled
- [ ] Verify success notification

## 8. Site Recommendations

### Setup
- [ ] Fill a key on OpenAI platform
- [ ] Check "Remember this key for this site" (if visible)
- [ ] Close and reopen extension on same site

### Test
- [ ] Verify "Recommended for this site" section appears
- [ ] Verify the previously used key is shown
- [ ] Click recommended key → fills correctly

## 9. Storage & Persistence

### Data Persistence
- [ ] Add several keys
- [ ] Close extension
- [ ] Reopen extension → verify all keys are still there
- [ ] Restart browser → verify keys persist

### Encryption
- [ ] Open Chrome DevTools
- [ ] Go to Application → IndexedDB → aikey_vault
- [ ] Check "keys" store
- [ ] Verify `encryptedValue` is not readable plaintext
- [ ] Verify `iv` field exists

## 10. Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to use extension → should still work (local-only)

### Invalid Data
- [ ] Try to add very long key (10000+ characters)
- [ ] Try to add empty string as key
- [ ] Try special characters in name/tag

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Edge (Chromium)
- [ ] Verify Manifest V3 compatibility

## 11. Security Checks

### Key Visibility
- [ ] Verify keys never show in plaintext in UI
- [ ] Check browser console for any logged keys
- [ ] Verify no keys in network tab (should be empty)

### Storage Security
- [ ] Check chrome.storage.local for encryption salt
- [ ] Verify salt is base64 encoded
- [ ] Verify no plaintext keys in storage

### Permissions
- [ ] Check extension only requests necessary permissions
- [ ] Verify no unnecessary host permissions

## 12. UI/UX

### Visual Design
- [ ] Check Material Design consistency
- [ ] Verify colors match brand (blue primary)
- [ ] Check spacing and alignment
- [ ] Verify icons are visible (even if placeholders)

### Responsiveness
- [ ] Resize popup → verify layout adapts
- [ ] Check scrolling works with many keys
- [ ] Verify buttons are clickable

### Animations
- [ ] Check notification slide-in/out animation
- [ ] Verify smooth transitions

## 13. Edge Cases

### Empty States
- [ ] Delete all keys → verify empty state message
- [ ] Search with no results → verify message

### Many Keys
- [ ] Add 20+ keys
- [ ] Verify list scrolls correctly
- [ ] Verify search still works
- [ ] Check performance

### Long Text
- [ ] Add key with very long name (100+ chars)
- [ ] Add key with very long tag
- [ ] Verify UI handles gracefully (truncation/wrapping)

## 14. Developer Experience

### Build
- [ ] Run `npm run build` → builds successfully
- [ ] Check dist/ folder is created
- [ ] Verify no TypeScript errors

### Development Mode
- [ ] Run `npm run dev`
- [ ] Make a small change to UI
- [ ] Verify hot reload works
- [ ] Check console for errors

## Bug Tracking

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
|       |          |        |       |

## Test Results Summary

- **Total Tests**: 100+
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___
- **Not Tested**: ___

## Sign-Off

- [ ] All critical tests passed
- [ ] No blocking bugs
- [ ] Ready for M2 development

**Tester**: _______________
**Date**: _______________
**Build Version**: 0.1.0
