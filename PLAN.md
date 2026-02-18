# Implementation Plan: Service Filter for Module B-3

## Overview
Add service filtering functionality to complete Module B-3 requirements. Users will be able to filter keys by service type (OpenAI, Anthropic, Azure OpenAI, Groq, Custom) in addition to the existing profile filtering.

## Current State Analysis

### Existing Components
1. **ProfileSelector** (`src/components/ProfileSelector.tsx`)
   - Custom dropdown component with CSS styling
   - Pattern: trigger button + dropdown menu + click-outside handling
   - Uses ref-based dropdown positioning
   - Styled with `ProfileSelector.css`

2. **Service Types** (`src/types/index.ts:3`)
   - Already defined: `type ServiceType = 'OpenAI' | 'Anthropic' | 'Azure OpenAI' | 'Groq' | 'Custom'`
   - Used in AddKeyDialog with `SERVICES` constant array

3. **Current Filtering** (`src/popup/PopupSimple.tsx:274-279`)
   - Search-based filtering on name, service, tag
   - Profile filtering via key loading per profile
   - No service-specific filter UI

## Implementation Approach

### Option 1: Custom Dropdown Component (Recommended)
**Pros:**
- Consistent with existing ProfileSelector pattern
- Full control over styling and behavior
- Matches current design language
- Lightweight, no additional dependencies

**Cons:**
- More code to write
- Need to create CSS file

### Option 2: Material-UI Select Component
**Pros:**
- Already using MUI in PopupSimple
- Less code to write
- Built-in accessibility

**Cons:**
- Different visual style from ProfileSelector
- Less customization flexibility
- Heavier component

**Decision: Option 1** - Create a custom ServiceFilter component matching ProfileSelector's pattern for UI consistency.

## Implementation Steps

### Step 1: Create ServiceFilter Component
**File:** `src/components/ServiceFilter.tsx`

Component structure:
```typescript
interface ServiceFilterProps {
  selectedService: ServiceType | 'All';
  onServiceChange: (service: ServiceType | 'All') => void;
}
```

Features:
- Dropdown trigger showing current selection
- Menu with "All Services" + individual service options
- Click-outside handling
- Visual indicator for active selection

### Step 2: Create ServiceFilter Styles
**File:** `src/components/ServiceFilter.css`

Reuse ProfileSelector styling patterns:
- `.service-filter` (container)
- `.service-filter-trigger` (button)
- `.service-dropdown` (menu)
- `.service-item` (menu items)

### Step 3: Update PopupSimple Component
**File:** `src/popup/PopupSimple.tsx`

Changes:
1. Add state: `const [selectedService, setSelectedService] = useState<ServiceType | 'All'>('All')`
2. Import ServiceFilter component
3. Place ServiceFilter next to search box (line ~366)
4. Update `filteredKeys` logic (lines 274-279) to include service filtering:
   ```typescript
   const filteredKeys = keys.filter((key: KeyDisplay) => {
     const matchesSearch =
       key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       key.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
       key.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       key.keyPrefix.toLowerCase().includes(searchQuery.toLowerCase());

     const matchesService = selectedService === 'All' || key.service === selectedService;

     return matchesSearch && matchesService;
   });
   ```

### Step 4: UI Layout
Position ServiceFilter in the toolbar area:
- Option A: Next to search box (horizontal layout)
- Option B: Below search box (vertical stack)
- **Recommended: Option A** - More compact, better use of space

Layout structure:
```
[Search Box] [Service Filter ▼]
```

### Step 5: Enhanced Search (Bonus)
Add `keyPrefix` to search filter (currently missing):
- Update line 276-278 to include `key.keyPrefix.toLowerCase().includes(...)`

## Files to Create/Modify

### New Files
1. `src/components/ServiceFilter.tsx` (~100 lines)
2. `src/components/ServiceFilter.css` (~150 lines, adapted from ProfileSelector.css)

### Modified Files
1. `src/popup/PopupSimple.tsx`
   - Add import for ServiceFilter
   - Add selectedService state
   - Update filteredKeys logic
   - Add ServiceFilter component to UI

## Testing Checklist
- [ ] Service filter dropdown opens/closes correctly
- [ ] "All Services" shows all keys
- [ ] Each service filter shows only matching keys
- [ ] Service filter + search work together
- [ ] Service filter + profile switching work together
- [ ] Empty state shows when no keys match filters
- [ ] Click outside closes dropdown
- [ ] Visual styling matches ProfileSelector

## Acceptance Criteria (Module B-3)
- [x] Profile filtering (already implemented)
- [ ] Service filtering (to be implemented)
- [ ] Combined filters work together
- [ ] UI is intuitive and consistent with existing design

## Estimated Complexity
- **Low-Medium**: Reusing existing patterns from ProfileSelector
- **Risk**: None - purely additive feature, no breaking changes
- **Dependencies**: None - all types and infrastructure already exist
