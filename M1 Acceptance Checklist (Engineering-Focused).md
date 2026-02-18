M1 Acceptance Checklist (Engineering-Focused)
1. Global Experience
G-1: Language & Copy

All UI text is in English only (welcome page, buttons, empty states, errors, toasts, etc.).
Copy tone is professional and concise, without slang or mixed Chinese/English.
G-2: Visual Style

Overall style follows Material Design principles:
Consistent primary color (blue), neutral colors, and error color.
Consistent button styles (primary/secondary), no random variations.
Consistent border radius, shadows, and spacing (cards, modals, inputs, lists).
All surfaces (popup, options page, welcome page) feel like one coherent product, not three separate UIs.
G-3: Layout & Responsiveness

For typical extension popup/options sizes, layout does not break:
No content overflow, no weird clipping, no required horizontal scrolling.
Lists and forms remain smooth and responsive with 10–20 keys (no noticeable lag).
G-4: Errors & Loading States

All async operations (save key, delete key, fill key) show clear UI states:
While in progress: disabled buttons or visible loading indicator.
On failure: visible error message; no silent failures.
2. Module A: Local Encrypted Key Vault (Manual Add)
A-1: Key Data Structure

Each key entry contains at least: id, service, keyValue, name, tag, profile, updatedAt.
All sensitive fields are encrypted and stored locally only; nothing is sent to any server.
A-2: Add Key Form

Fields:
Service: dropdown with at least OpenAI / Anthropic / Azure OpenAI / Groq / Custom.
Key: text input, supports paste.
Name: optional; default value is Service – Profile (e.g., OpenAI – Personal).
Tag / Project: optional text input.
Profile: required; defaults to current profile (Personal/Work).
Validation:
Required fields must be filled; otherwise the form cannot be submitted and inline error is shown near the field.
Basic length check for the key to avoid obvious wrong inputs, but no upstream API validation.
A-3: Edit & Delete

User can open a key detail/edit view and modify Name / Tag / Profile / key value.
Deleting a key:
Shows a confirmation dialog with clear warning that deletion is irreversible.
After confirming, the key is removed from the list.
A-4: Secure Display Rules

In lists, only show key prefix (e.g., sk-****abcd).
In the details view:
Full key is shown only after clicking “Show”.
Full key auto-hides again after a short period (e.g., 3–5 seconds).
There is a dedicated “Copy” button to copy the full key to clipboard.
Security copy is visible in settings or a clearly accessible place, e.g.:
“Your keys are stored locally on this device and encrypted.”
3. Module B: Key List View & Search / Filter
B-1: List Content

Each row shows at least:
Service logo
Name
Service
Tag / project
Key prefix (sk-****abcd)
Last updated time (optional)
Clicking a row opens key detail (view/edit/delete).
B-2: Search

A search box is visible at the top.
Typing in the search box filters the list in real time.
Fuzzy search applies to:
Name
Service
Tag / project
Key prefix
When no results match, a “no results” message is shown (not a blank screen).
B-3: Filters

User can filter by Service (e.g., only OpenAI / Anthropic).
User can filter by Profile (linked to current profile, see Module C).
Service and Profile filters can be combined.
B-4: Empty States

When there are no keys at all:
Show a clear empty state message, e.g.
“No keys yet. Add your OpenAI / Anthropic / Azure keys to see everything in one place.”
Show a clear Add my first key CTA button that opens the Add Key flow.
4. Module C: Basic Profile Capability (Personal / Work)
C-1: Profile Basics

The system has two built-in profiles: Personal and Work.
These two profiles cannot be deleted or renamed in M1 (keep things simple).
C-2: Profile Selection & Binding

Add/Edit Key form includes a Profile field.
Profile is required; default is current profile (Personal/Work).
Saved key data always includes a valid profile and is used for filtering.
C-3: Profile Switch Component

The main extension panel has a Profile switcher at the top (dropdown or pill).
When switching profile:
The selected profile is persisted (next time the extension opens, it defaults to that profile).
The list automatically shows only keys belonging to that profile.
C-4: Profile Experience Feedback

Switching profile shows a lightweight feedback (e.g., toast):
“You’re now using Work profile.”
Add Key view includes helper copy, e.g.:
“Is this a personal key or a work key?”
5. Module D: Core Sites One-Click Fill (Basic)
D-1: Supported Sites

At least 2–3 sites are supported, for example:
OpenAI Console (e.g. platform.openai.com key settings page).
Anthropic Console (console.anthropic.com).
At least 1 third-party AI tool site.
Each supported site is mapped to a specific Service (OpenAI / Anthropic / Custom, etc.).
D-2: Extension Panel Behavior on Supported Sites

On a supported site, when the user clicks the extension icon:
Panel shows current profile at the top (switchable).
The main area shows keys filtered by:
Current profile
Service mapped from the current site
Each list item shows at least Name + key prefix; clicking a key triggers fill.
D-3: Fill Behavior

When a user clicks a key:
The content script finds the target input field and writes the full key.
Necessary DOM events (input, change, etc.) are fired so the page reacts correctly.
A success message is shown in the panel, e.g.:
“Filled your OpenAI key from Personal profile.”
Optionally: “You no longer need to store this key in this website.”
Error handling:
If no appropriate input field can be found:
Show message: “Couldn’t find a key field on this page. Make sure you’re on the API key settings page.”
If there is no key for this Service in the current profile:
Show message: “No OpenAI keys in this profile yet.”
Show CTA button Add an OpenAI key leading to Add Key form.
D-4: Scope Control

No automatic, silent filling without user click in M1.
No “Remember this key for this site” or domain → key binding in M1 (that belongs to M2).
6. Module E: Welcome Page & First-Run Experience
E-1: First-Run Logic

On first install / first open:
User is taken to the welcome page, not directly to the list.
Once the user has added at least one key:
Subsequent opens go directly to the key list, not the welcome page.
E-2: Welcome Page Content

Includes:
Title, e.g. “Too many AI API keys?”
Subtitle, e.g. “Store them once in AiKey. Fill them anywhere in one click.”
Two primary CTA buttons:
Add my first key → opens Add Key form.
Explore my empty vault → opens the empty list view.
Three bullets, for example:
“Using OpenAI, Anthropic, Azure or others?”
“Copy-pasting keys into many tools?”
“Managing personal / work / client keys?”
All copy is English and consistent with the rest of the app.
E-3: Flow Correctness

From Add my first key:
After successfully saving the first key, the user is taken to the list and sees that key.
From Explore my empty vault:
User sees the empty list state with empty state copy and a CTA to add a key.
7. Technical: Local Key Usage Footprint (No UI in M1)
T-1: Logging

Whenever a key is filled into a site via the extension, log a local entry with:
keyId
domain (current site domain)
profile (current profile)
timestamp
Logs are stored locally (e.g. chrome.storage.local), never sent to any server.
T-2: API Wrapper

Provide a clear internal API, e.g. logKeyUsage({ keyId, domain, profile }).
Future M2/M3 features can reuse this without changing current call sites.
8. M1 Definition of Done
M1 is considered done only if:

All “must-have” items in Modules A–E above are implemented and pass manual testing.
The following three user journeys have no obvious UX/visual/copy issues:
New install → welcome page → add first key → see it in vault → edit/delete.
Existing vault with multiple keys → search/filter/view/switch profile.
On OpenAI/Anthropic supported pages → open extension → choose key → fill or see clear error message.
All UI is English-only, visually consistent, without placeholder or obviously “temporary” UI.
