Scope & Goals
Scope (M1 only)
Local encrypted key vault with manual add/edit/delete.
Key list with search, filters, and basic profiles (Personal / Work).
One‑click fill on a small set of supported sites (OpenAI, Anthropic, one 3rd‑party tool).
First‑run welcome page and minimal onboarding.
Out of scope for this spec (M2/M3)
.env / text import.
Site bindings (remember this key for this site).
Advanced profile management (more than Personal / Work, multi‑profile per key, etc.).
Any cloud sync or multi‑device features.
Core Concepts
Key

Represents one API key for a given service.
Fields: id, service, keyValue, name, tag, profile, updatedAt.
Stored locally and encrypted. Never sent to any server.
Service

Predefined options: OpenAI, Anthropic, Azure OpenAI, Groq, Custom.
Used for filtering and for mapping supported websites → which keys to show.
Profile

M1 has two built‑in profiles: Personal and Work.
Every key belongs to exactly one profile.
The current active profile controls which keys are visible and used on supported sites.
Global UX & Visual Style
Language & tone

All UI text is English‑only.
Tone is professional, clear, and concise; no slang, no Chinese.
Visual style

Follow Material Design style:
Primary color: blue.
Neutral grays for surfaces, error color for validation errors and failures.
Consistent border radius, shadows, spacing across popup, options, welcome page.
Extension feels like one coherent product (same typography, buttons, inputs).
Async feedback

For any async action (save, edit, delete, fill):
While in progress: disable primary button or show inline loading indicator.
On success: close dialog or show lightweight success toast.
On failure: show inline error message with short text; never fail silently.
Surface 1 – Chrome Web Store Listing (Marketing Copy)
Main title options (can be combined / A/B tested, but at least one is used):

“Stop copy‑pasting AI API keys into every website.”
“See all your OpenAI / Anthropic / Azure keys in one place.”
Subtitle options (at least one used):

“Separate personal / work / client keys with profiles.”
Screenshots / GIF order:

All‑keys view with multiple service logos and list layout.
One‑click fill on OpenAI / Anthropic web pages.
Top‑bar Personal / Work profile toggle in the extension popup.
Surface 2 – First‑Run Welcome Page
2.1 Entry & Flow
Trigger

On first install / first open of the extension (no keys stored yet).
User is taken to the Welcome Page, not directly to the list.
Flow rules

If the user has no keys:
Opening the extension options or clicking a “Open AiKey” link should show the welcome page.
After user successfully adds the first key:
Next opens go directly to Key List view, not back to welcome page.
2.2 Layout & Content
Title

“Too many AI API keys?”
Subtitle

“Store them once in AiKey. Fill them anywhere in one click.”
Primary buttons

Button 1 (primary):
Label: “Add my first key”
Action: opens the Add Key flow (Key Add screen / modal).
Button 2 (secondary):
Label: “Explore my empty vault”
Action: opens Key List with empty state.
Bullets (below buttons)

“Using OpenAI, Anthropic, Azure or others?”
“Copy‑pasting keys into many tools?”
“Managing personal / work / client keys?”
2.3 Welcome Page → Next Screen
From “Add my first key”

Open Add Key form with:
Default Profile = Personal.
After successful save:
Redirect to Key List, scrolled to/showing the newly added key.
From “Explore my empty vault”

Show Key List in empty state (see Section 3.3).
Surface 3 – Main Extension Popup (Key Vault & Profiles)
Popup is the main “vault” interface and is also used on supported websites.

3.1 Layout Overview
Top bar

Profile switcher (left or center):
Shows current profile: “Personal” or “Work”.
Interaction: clicking opens dropdown with:
“Personal”
“Work”
On change:
Persist selected profile for next open.
Filter the key list to only show keys with that profile.
Show lightweight toast:
“You’re now using Work profile.”
Optional: extension name/logo on the left.
Toolbar area (below top bar)

Search box:
Placeholder: “Search by name, service, tag, or prefix…”
Typing filters list in real time on:
Name
Service
Tag / project
Key prefix
Filters:
Service filter:
Dropdown / pills: “All services, OpenAI, Anthropic, Azure OpenAI, Groq, Custom”.
Profile filter:
Usually implied by Active Profile, but a second filter can be present if desired.
Minimum requirement: active profile alone must filter keys.
Main content

Key list
Or empty state when there are no keys.
Bottom area

Primary CTA button:
Label: “Add key”
Opens Add Key form.
3.2 Key List View (Normal)
Each row shows at least:

Service logo (OpenAI, Anthropic, Azure, Groq, generic for Custom).
Name (e.g., “OpenAI – Personal”).
Service (text label).
Tag / project (if present; otherwise empty or “—”).
Key prefix:
Only show partial key, e.g. “sk-****abcd”.
Last updated at (optional, formatted like “Updated 2 days ago”).
Interactions

Clicking a row:
Opens Key Detail / Edit view (could be modal or full panel).
3.3 Empty State in Key List
Condition: user has zero keys in storage.

Empty state copy

Title:
“No keys yet.”
Body:
“Add your OpenAI / Anthropic / Azure keys to see everything in one place.”
Primary button:
Label: “Add my first key”
Action: open Add Key form.
3.4 Search & Filter Behavior
Search

Search box always visible at the top of the list area.
As user types:
Filter list instantly on:
Name
Service
Tag / project
Key prefix
If no results:
Show message:
“No keys match your search.”
Optional link:
“Clear search”
Service filter

Default: “All services”.
When user selects a specific service (e.g., OpenAI):
List shows only keys with service = OpenAI AND profile = currentProfile.
Profile filter

Driven primarily by the Profile switcher at top.
When profile changes:
Reset search or keep it (implementation choice), but always apply:
profile = currentProfile.
Surface 4 – Add / Edit / Delete Key
This can be implemented as a modal dialog or a full‑screen panel inside popup/options.

4.1 Add Key Form
Trigger

From Welcome Page:
“Add my first key”.
From Key List:
“Add key” button.
From error states (e.g., no keys for this service on a site):
CTA “Add an OpenAI key”.
Fields

Service (required)
Type: dropdown.
Options (at least):
“OpenAI”
“Anthropic”
“Azure OpenAI”
“Groq”
“Custom”
Key (required)
Type: text input (single line).
Must support paste.
Basic length check (e.g., at least 10 characters) for obvious mistakes.
Name (optional)
Default value (auto‑suggested when opening form, can be edited):
“{Service} – {Profile}”
Example: “OpenAI – Personal”.
Tag / Project (optional)
Type: text input.
Examples shown in placeholder, e.g. “Side project, Client A…”.
Profile (required)
Type: dropdown or pill selector.
Options: “Personal”, “Work”.
Default: current active profile.
Helper text:
“Is this a personal key or a work key?”
Buttons

Primary: “Save key”
Secondary: “Cancel”
Validation

If required fields are empty:
Inline error near field:
Service empty: “Please select a service.”
Key empty: “Please enter your API key.”
Profile empty (should not happen in normal UI): “Please select a profile.”
If key is obviously too short:
“This key looks too short. Please double‑check and try again.”
Async state

On submit:
Disable “Save key” and show loading indicator (spinner or “Saving…” text).
On success:
Close modal and return to Key List.
The new key appears in the list (with correct profile).
On failure (e.g., storage error):
Show inline error:
“Could not save your key. Please try again.”
4.2 Key Detail / Edit View
Displayed info

Service logo.
Name (editable).
Service (read‑only).
Tag / project (editable).
Profile (editable dropdown between Personal / Work).
Key display area:
Masked by default: “sk-****abcd”.
Button: “Show”
Button: “Copy”
Show / hide key

Default: show masked key.
When user clicks “Show”:
Reveal full key value in a monospaced field.
Start a 3–5 second timer.
After time passes, automatically mask again to “sk-****abcd”.
Security helper text, visible in this view or in Settings:
“Your keys are stored locally on this device and encrypted.”
Copy key

Clicking “Copy”:
Copies full key to clipboard.
Shows toast:
“Key copied to clipboard.”
Key may stay visible until auto‑hide triggers or user closes view.
Buttons

Primary: “Save changes”
Secondary: “Cancel”
Destructive: “Delete key” (text button or red button at bottom).
4.3 Delete Key
Trigger

“Delete key” from Key Detail / Edit view.
Confirmation dialog

Title:
“Delete this key?”
Body:
“This action cannot be undone. You will not be able to recover this key from AiKey.”
Buttons:
Primary (destructive): “Delete”
Secondary: “Cancel”
Behavior

On “Delete”:
Remove key from local storage.
Close dialog and Key Detail view.
Return to list with that row removed.
On failure:
Show error:
“Could not delete this key. Please try again.”
Surface 5 – Extension Popup on Supported Sites (One‑Click Fill)
This is the same popup, but with special filtering and fill behavior when opened on supported sites.

5.1 Supported Sites & Mapping
Minimum M1 support

OpenAI Console (e.g., platform.openai.com API key/settings page).
Anthropic Console (console.anthropic.com).
At least one third‑party AI tool site (e.g., a typical playground or integration).
Site → Service mapping examples

platform.openai.com → Service = OpenAI.
console.anthropic.com → Service = Anthropic.
Third‑party site: mapped to either a specific service or “Custom” depending on design.
5.2 Popup Behavior on Supported Sites
When user clicks the extension icon
Top bar:
Show current Profile (Personal / Work) with switcher as usual.
Main list:
Automatically filter keys by:
profile = currentProfile
service = mappedServiceForThisDomain
If there are matching keys:
Show list of those keys (same row layout as main list).
If no keys for this service in current profile:
Show message:
“No OpenAI keys in this profile yet.” (service name changes per site).
Show CTA button:
“Add an OpenAI key”
Action: open Add Key form with:
Service preselected = OpenAI.
Profile preselected = current profile.
5.3 Fill Behavior
Trigger

User clicks a key row in the popup while on a supported site.
Expected behavior

Content script:
Finds the appropriate API key input field on the page.
Writes the full key value into the field.
Fires necessary DOM events (input, change, etc.) so the page detects the change.
Success feedback (inside popup)

Show message (toast or inline banner):
Primary line:
“Filled your OpenAI key from Personal profile.”
Replace “OpenAI” with service name.
Replace “Personal” with current profile name.
Optional secondary line:
“You no longer need to store this key in this website.”
The popup stays open or auto‑closes based on UX choice, but message must be visible.
Error cases

If no suitable input field can be found:
Message:
“Couldn’t find a key field on this page. Make sure you’re on the API key settings page.”
If there is a technical error (e.g., script cannot access DOM):
Message:
“Something went wrong while filling your key. Please try again.”
Scope control

M1 explicitly does not:
Auto‑fill without user clicking a key.
Remember key for this site (no domain → key binding yet).
Surface 6 – Technical Footprint Logging (No UI in M1)
Behavior

Every time a key is filled into a site via the extension:
Log a local record:
keyId
domain (current site domain)
profile (current active profile)
timestamp
Storage:
Local only (e.g., chrome.storage.local).
Never sent to any remote server.
Internal API suggestion (no visible UI)

Function (example name):
logKeyUsage({ keyId, domain, profile })
This is used by the fill behavior and will be reused by future M2+ features.
Key User Journeys (for Validation)
Journey 1 – New install → first key

Install extension → welcome page → “Add my first key” → fill form → save → see key in vault list → optionally edit/delete.
Journey 2 – Managing multiple keys

Existing user with multiple keys → open popup → search/filter by service and tag → switch between Personal / Work profiles → see filtered lists, no visual breakage.
Journey 3 – Filling a key on a supported site

User navigates to OpenAI/Anthropic console → clicks extension → sees filtered keys for current profile & service → selects a key → field on page is filled → success message shown (or informative error if field not found).
