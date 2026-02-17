# M2 Testing Guide

Quick guide to test all Phase 2 features.

---

## 🚀 Quick Start

1. **Build the extension**
   ```bash
   npm run build
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Open the popup**
   - Click the AiKey extension icon
   - You should see the main interface

---

## 🧪 Test 1: .env Import

### Prepare Test Data
Create a test `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-test123456789abcdefghijklmnopqrstuvwxyz

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-api03-test123456789abcdefghijklmnopqrstuvwxyz

# Azure OpenAI
AZURE_OPENAI_KEY=1234567890abcdef1234567890abcdef

# Google AI
GOOGLE_API_KEY=AIzaSyTest123456789abcdefghijklmnop

# Other keys
COHERE_API_KEY=test_cohere_key_1234567890abcdefghijklmnop
HF_TOKEN=hf_test123456789abcdefghijklmnopqrstuvwxyz
```

### Test Steps

1. **Open popup** → Click "Import from .env" button
2. **Upload file** → Choose your test .env file
   - OR paste the content directly
3. **Verify detection**:
   - Should detect 6 API keys
   - OpenAI key → Service: OpenAI
   - Anthropic key → Service: Anthropic
   - Azure key → Service: Azure
   - Google key → Service: Google
   - Cohere key → Service: Cohere
   - HF token → Service: Hugging Face
4. **Customize** (optional):
   - Change display names
   - Change service types
   - Uncheck keys you don't want
5. **Click "Next"** → Review summary
6. **Click "Import X Keys"** → Wait for completion
7. **Verify**: Keys should appear in your vault

### Expected Results
✅ All 6 keys detected
✅ Services auto-detected correctly
✅ Friendly names generated (e.g., "Openai" from "OPENAI_API_KEY")
✅ Keys imported and encrypted
✅ "imported" tag added to all keys

---

## 🧪 Test 2: Site Recommendations

### Test Steps

1. **Visit OpenAI Platform**
   - Open https://platform.openai.com in a new tab
   - Open AiKey popup
   - You should see your keys list

2. **Fill a key**
   - Click on any OpenAI key in the list
   - Key should be filled (or copied if no input field)

3. **Close and reopen popup**
   - Close the popup
   - Open it again on the same site

4. **Verify recommendation**
   - You should see "Recommended for this site" section
   - The key you just used should appear there
   - It should have a blue border and light blue background

5. **Test on different site**
   - Visit https://console.anthropic.com
   - Open popup
   - Should NOT show OpenAI key as recommended
   - Fill an Anthropic key
   - Reopen popup
   - Anthropic key should now be recommended

### Expected Results
✅ First use: No recommendations
✅ After filling: Binding created
✅ Next visit: Key recommended
✅ Visual distinction: Blue border, light background
✅ Different sites: Different recommendations

---

## 🧪 Test 3: Usage Logging

### Test Steps

1. **Fill a key**
   - Visit any website
   - Open popup
   - Click a key to fill it

2. **Copy a key**
   - Click the "Copy" button on a key

3. **Verify logs** (via console):
   ```javascript
   // Open DevTools on popup
   // Run in console:
   chrome.runtime.sendMessage({
     type: 'GET_USAGE_LOGS',
     payload: {},
     requestId: 'test'
   }, console.log);
   ```

### Expected Results
✅ Fill action logged with domain
✅ Copy action logged with domain
✅ Timestamp recorded
✅ Profile ID associated
✅ Key ID recorded

---

## 🧪 Test 4: Profile Isolation

### Test Steps

1. **Use key in Personal profile**
   - Ensure "Personal" profile is active (check chip in header)
   - Visit a website
   - Fill a key

2. **Switch to Work profile**
   - (Note: Full profile switching UI is in M3)
   - For now, verify bindings are profile-specific

3. **Verify isolation**
   - Recommendations should be profile-specific
   - Personal profile bindings ≠ Work profile bindings

### Expected Results
✅ Bindings are profile-specific
✅ Recommendations respect current profile
✅ No cross-profile leakage

---

## 🧪 Test 5: Import Edge Cases

### Test Data

```env
# Empty value (should be skipped)
EMPTY_KEY=

# Very short value (should be skipped)
SHORT=abc

# No equals sign (should be skipped)
INVALID_LINE

# Quoted values (should be unquoted)
QUOTED_KEY="sk-test123456789abcdefghijklmnopqrstuvwxyz"

# Single quoted (should be unquoted)
SINGLE_QUOTED='sk-test123456789abcdefghijklmnopqrstuvwxyz'

# With inline comment (comment should be ignored)
KEY_WITH_COMMENT=sk-test123456789abcdefghijklmnopqrstuvwxyz # This is my key

# With preceding comment (should be associated)
# Production API key
PROD_KEY=sk-test123456789abcdefghijklmnopqrstuvwxyz
```

### Expected Results
✅ Empty values skipped
✅ Short values skipped
✅ Invalid lines skipped
✅ Quoted values unquoted correctly
✅ Comments handled properly
✅ Only valid API keys imported

---

## 🧪 Test 6: UI/UX Flow

### Test Steps

1. **First-time user**
   - Clear extension data
   - Reload extension
   - Should see welcome screen
   - Click "Add API Key" or "Import from .env"

2. **Import wizard flow**
   - Step 1: Upload/paste
   - Step 2: Review and customize
   - Step 3: Confirm and import
   - Should be able to go back
   - Should be able to cancel

3. **Search functionality**
   - Import multiple keys
   - Use search box
   - Verify filtering works

4. **Recommendation visibility**
   - Recommendations should appear above regular keys
   - Should have clear visual distinction
   - Should update when switching tabs

### Expected Results
✅ Smooth wizard flow
✅ Clear visual feedback
✅ No UI glitches
✅ Responsive interactions
✅ Proper error handling

---

## 🐛 Common Issues & Solutions

### Issue: Keys not detected
**Solution**: Ensure keys are in format `KEY_NAME=value` and values look like API keys (20+ chars, no spaces)

### Issue: Service not detected
**Solution**: Service detection is best-effort. You can manually select the correct service in step 2.

### Issue: Recommendations not showing
**Solution**:
1. Ensure you've filled a key on the site before
2. Check that you're on the same profile
3. Verify the domain matches (www.example.com ≠ example.com)

### Issue: Import fails
**Solution**:
1. Check console for errors
2. Verify .env file format
3. Ensure at least one valid API key exists

---

## 📊 Success Criteria

M2 is working correctly if:

- ✅ Can import .env files with multiple keys
- ✅ Services are auto-detected correctly
- ✅ Keys are encrypted and stored
- ✅ Recommendations appear after using keys
- ✅ Recommendations are site-specific
- ✅ Recommendations are profile-specific
- ✅ Usage is logged with domain
- ✅ UI is smooth and responsive
- ✅ No console errors
- ✅ Build completes successfully

---

## 🔍 Debug Tips

### View Storage
```javascript
// In popup DevTools console
chrome.storage.local.get(null, console.log);
```

### View IndexedDB
1. Open DevTools
2. Go to Application tab
3. Expand IndexedDB
4. Open `aikey_vault`
5. Inspect stores: keys, profiles, bindings, usageLogs

### View Background Logs
1. Go to `chrome://extensions/`
2. Find AiKey extension
3. Click "service worker" link
4. View console logs

### Test Messages
```javascript
// Send message to background
chrome.runtime.sendMessage({
  type: 'GET_SITE_RECOMMENDATIONS',
  payload: { domain: 'platform.openai.com', profileId: 'xxx' },
  requestId: 'test'
}, console.log);
```

---

## 📝 Test Report Template

```markdown
## M2 Test Report

**Date**: [Date]
**Tester**: [Name]
**Version**: 0.1.1

### Test Results

- [ ] .env Import: PASS / FAIL
- [ ] Site Recommendations: PASS / FAIL
- [ ] Usage Logging: PASS / FAIL
- [ ] Profile Isolation: PASS / FAIL
- [ ] Edge Cases: PASS / FAIL
- [ ] UI/UX Flow: PASS / FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]
```

---

**Happy Testing! 🎉**

If you find any issues, check the console logs and IndexedDB data for debugging.
