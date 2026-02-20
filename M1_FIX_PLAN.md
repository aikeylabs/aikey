# M1 Acceptance Checklist - Fix Plan

## Current Status
- **Active Popup**: `PopupSimple.tsx` (used in App.tsx)
- **Duplicate Files Found**:
  - `Popup.tsx` (unused, uses React Query)
  - `EditKeyDialog.tsx` in two locations with different implementations
- **Critical Issues**: Chinese text in `/src/components/EditKeyDialog.tsx`

---

## Priority 1: Critical Fixes (MUST FIX FIRST)

### 1.1 Remove Chinese Text ❌ CRITICAL
**File**: `/src/components/EditKeyDialog.tsx`
**Issue**: Contains Chinese labels (编辑 API Key, 服务, 名称, 标签, 取消, 保存)
**Action**:
- This file uses Tailwind CSS (not Material-UI like the rest)
- The correct file is `/src/popup/components/EditKeyDialog.tsx` (Material-UI, English)
- **DELETE** `/src/components/EditKeyDialog.tsx` entirely
- Ensure all imports reference `/src/popup/components/EditKeyDialog.tsx`

### 1.2 Remove Duplicate Popup.tsx ❌ CRITICAL
**File**: `/src/popup/Popup.tsx`
**Issue**: Unused duplicate implementation
**Action**:
- **DELETE** `/src/popup/Popup.tsx` (not used in App.tsx)
- Keep `PopupSimple.tsx` as the single source of truth

---

## Priority 2: M1 Acceptance Checklist Audit

### G-1: Language & Copy ⚠️ NEEDS VERIFICATION
**Status**: Mostly English, but need to verify all components
**Action**:
- [x] WelcomeScreen.tsx - ✅ All English
- [x] AddKeyDialog.tsx - ✅ All English
- [x] PopupSimple.tsx - ✅ All English
- [ ] ProfileManager.tsx - Need to check
- [ ] ProfileSelector.tsx - Need to check
- [ ] EnvImportWizard.tsx - Need to check
- [ ] Error messages in background/index.ts - Need to check

### G-2: Visual Style ⚠️ NEEDS IMPROVEMENT
**Status**: Material-UI used but inconsistent styling
**Issues**:
- ProfileManager.css and ProfileSelector.css use custom CSS
- Some components use `sx` prop, others use CSS files
**Action**:
- Consolidate to Material-UI `sx` prop for consistency
- Remove custom CSS files where possible
- Ensure consistent primary color (#1E88E5), spacing, and shadows

### G-3: Layout & Responsiveness ✅ LIKELY OK
**Status**: Fixed 400x600 popup size
**Action**: Manual testing needed with 10-20 keys

### G-4: Errors & Loading States ⚠️ NEEDS VERIFICATION
**Status**: Some loading states exist, need comprehensive check
**Action**:
- Verify all async operations show loading indicators
- Verify all errors are displayed to users (not just console.log)
- Check: addKey, deleteKey, updateKey, fillKey, importEnv

---

### A-1: Key Data Structure ✅ COMPLETE
**Status**: Verified in types/index.ts
```typescript
interface EncryptedKey {
  id: string;
  service: ServiceType;
  encryptedValue: string;
  name?: string;
  tag?: string;
  profile: string;
  createdAt: number;
  updatedAt: number;
}
```

### A-2: Add Key Form ⚠️ NEEDS VALIDATION IMPROVEMENT
**Status**: Form exists but validation is minimal
**Current**:
- ✅ Service dropdown (OpenAI, Anthropic, Azure OpenAI, Groq, Custom)
- ✅ Key input with paste support
- ✅ Name (optional)
- ✅ Tag (optional)
- ✅ Profile (defaults to current)
- ⚠️ Validation: Only checks if key is empty

**Action**:
- Add minimum length validation (e.g., 20 characters)
- Add inline error messages near fields
- Show validation errors before submit attempt

### A-3: Edit & Delete ⚠️ PARTIAL
**Status**: Edit exists, delete needs confirmation dialog
**Current**:
- ✅ Edit dialog exists (after fixing Chinese text issue)
- ❌ Delete has NO confirmation dialog

**Action**:
- Add confirmation dialog for delete with warning text:
  - "Are you sure you want to delete this key?"
  - "This action cannot be undone."
  - "Cancel" / "Delete" buttons

### A-4: Secure Display Rules ⚠️ NEEDS VERIFICATION
**Status**: Need to verify all security requirements
**Action**:
- [ ] Verify list shows only key prefix (sk-****abcd)
- [ ] Verify detail view hides full key by default
- [ ] Verify "Show" button reveals full key
- [ ] Verify auto-hide after 3-5 seconds
- [ ] Verify "Copy" button exists
- [ ] Add security notice: "Your keys are stored locally on this device and encrypted."

---

### B-1: List Content ✅ LIKELY COMPLETE
**Status**: PopupSimple.tsx shows list with service, name, tag, prefix
**Action**: Verify all fields are displayed correctly

### B-2: Search ✅ COMPLETE
**Status**: Search box exists in PopupSimple.tsx
**Action**: Verify fuzzy search works on name, service, tag, prefix

### B-3: Filters ⚠️ NEEDS VERIFICATION
**Status**: Profile filter exists via ProfileSelector
**Action**:
- [ ] Verify service filter exists
- [ ] Verify filters can be combined
- [ ] Add service filter dropdown if missing

### B-4: Empty States ⚠️ NEEDS VERIFICATION
**Status**: WelcomeScreen exists for first-run
**Action**:
- [ ] Verify empty state shows when no keys in current profile
- [ ] Verify "Add my first key" CTA button
- [ ] Verify message: "No keys yet. Add your OpenAI / Anthropic / Azure OpenAI / other API keys..."

---

### C-1: Profile Basics ✅ COMPLETE
**Status**: Personal and Work profiles exist in profileService.ts

### C-2: Profile Selection & Binding ✅ COMPLETE
**Status**: AddKeyDialog includes profile field

### C-3: Profile Switch Component ✅ COMPLETE
**Status**: ProfileSelector component exists

### C-4: Profile Experience Feedback ⚠️ NEEDS VERIFICATION
**Action**:
- [ ] Verify toast message on profile switch
- [ ] Verify helper text in Add Key form

---

### D-1: Supported Sites ⚠️ LIMITED
**Status**: Only OpenAI and Anthropic in siteAdapter.ts
**Action**:
- Current: 2 sites (OpenAI, Anthropic)
- M1 Requirement: "At least 2-3 sites"
- **DECISION NEEDED**: Add 1 more site OR accept 2 sites for M1?

### D-2: Extension Panel Behavior ⚠️ NEEDS VERIFICATION
**Action**:
- [ ] Verify panel shows current profile
- [ ] Verify keys filtered by profile + service
- [ ] Verify list shows name + prefix
- [ ] Verify clicking key triggers fill

### D-3: Fill Behavior ⚠️ NEEDS VERIFICATION
**Status**: content/index.ts exists
**Action**:
- [ ] Verify fill writes to correct input field
- [ ] Verify success message shown
- [ ] Verify error message if no input field found
- [ ] Verify error message if no keys for service
- [ ] Verify "Add an OpenAI key" CTA on error

### D-4: Scope Control ✅ COMPLETE
**Status**: No auto-fill, only manual click

---

### E-1: First-Run Logic ⚠️ NEEDS VERIFICATION
**Status**: WelcomeScreen component exists
**Action**:
- [ ] Verify first install shows welcome page
- [ ] Verify subsequent opens show key list
- [ ] Verify logic in PopupSimple.tsx handles this correctly

### E-2: Welcome Page Content ✅ COMPLETE
**Status**: WelcomeScreen.tsx has all required content

### E-3: Flow Correctness ⚠️ NEEDS VERIFICATION
**Action**:
- [ ] Test: Add first key → see it in list
- [ ] Test: Explore empty vault → see empty state → add key

---

### T-1: Logging ⚠️ NEEDS VERIFICATION
**Status**: usageService.ts exists
**Action**:
- [ ] Verify logging on fill
- [ ] Verify logging on copy
- [ ] Verify logs stored locally only

### T-2: API Wrapper ✅ COMPLETE
**Status**: usageService.ts has logKeyUsage function

---

## Priority 3: Implementation Tasks

### Task 1: Delete Duplicate Files
- [ ] Delete `/src/components/EditKeyDialog.tsx` (Chinese text)
- [ ] Delete `/src/popup/Popup.tsx` (unused)
- [ ] Update any imports if needed
- [ ] Test build succeeds

### Task 2: Add Delete Confirmation Dialog
- [ ] Create ConfirmDialog component
- [ ] Add to PopupSimple.tsx
- [ ] Show on delete button click
- [ ] Test delete flow

### Task 3: Improve Add Key Validation
- [ ] Add minimum length check (20 chars)
- [ ] Add inline error messages
- [ ] Show errors near fields
- [ ] Test validation

### Task 4: Verify Security Display Rules
- [ ] Check key prefix display in list
- [ ] Check full key hidden by default
- [ ] Add "Show" button if missing
- [ ] Add auto-hide timer
- [ ] Add "Copy" button
- [ ] Add security notice

### Task 5: Add Service Filter
- [ ] Add service filter dropdown to PopupSimple.tsx
- [ ] Combine with profile filter
- [ ] Test filtering

### Task 6: Verify Empty States
- [ ] Test empty state when no keys
- [ ] Verify CTA button works
- [ ] Verify message text

### Task 7: Add Profile Switch Feedback
- [ ] Add toast/snackbar on profile switch
- [ ] Add helper text in Add Key form
- [ ] Test feedback

### Task 8: Verify Fill Behavior
- [ ] Test fill on OpenAI site
- [ ] Test fill on Anthropic site
- [ ] Test error messages
- [ ] Test "Add key" CTA on error

### Task 9: Verify First-Run Flow
- [ ] Test fresh install → welcome page
- [ ] Test add first key → see list
- [ ] Test explore vault → empty state

### Task 10: Consolidate Styling
- [ ] Convert ProfileManager.css to sx prop
- [ ] Convert ProfileSelector.css to sx prop
- [ ] Ensure consistent colors and spacing
- [ ] Test visual consistency

---

## Testing Checklist (After All Fixes)

### Journey 1: New Install
- [ ] Fresh install shows welcome page
- [ ] Click "Add my first key"
- [ ] Fill form with valid data
- [ ] See key in vault
- [ ] Edit key (name, tag)
- [ ] Delete key (with confirmation)

### Journey 2: Existing Vault
- [ ] Open extension with multiple keys
- [ ] Search for key by name
- [ ] Filter by service
- [ ] Switch profile
- [ ] See profile-specific keys

### Journey 3: Fill on Supported Site
- [ ] Go to platform.openai.com
- [ ] Open extension
- [ ] See OpenAI keys
- [ ] Click key to fill
- [ ] See success message
- [ ] OR see error if no keys

---

## Definition of Done

M1 is complete when:
1. ✅ All Chinese text removed
2. ✅ All duplicate files removed
3. ✅ Delete confirmation dialog added
4. ✅ All validation improved
5. ✅ All security display rules verified
6. ✅ All empty states verified
7. ✅ All error messages verified
8. ✅ All three user journeys tested
9. ✅ All UI is English-only
10. ✅ Visual consistency achieved

---

## Estimated Effort

- **Priority 1 (Critical)**: 30 minutes
- **Priority 2 (Verification)**: 2 hours
- **Priority 3 (Implementation)**: 4-6 hours
- **Testing**: 2 hours

**Total**: ~8-10 hours of focused work
