## aikey CLI Specification (Phase 2)

> Version: v0.1-phase2  
> Audience: AiKey internal devs, Rust CLI (`aikeylabs-ak`) engineers / Claude  
> Goal for this phase: **Align command language and external interface, without changing the core crypto/storage design.**

---

### 1. Scope for this Phase

In this phase we ONLY do:

1. Make **`aikey`** the primary CLI entrypoint (binary name), while keeping **`ak`** as a shorthand / compatibility alias.
2. Based on the existing `ak` functionality, expose a stable set of subcommands using the `aikey <domain> <action>` style.
3. Add `--json` output mode to core commands (where straightforward), to prepare for VSCode and other integrations.
4. Add **shell commands (stubs)** for `profile` / `env` / `project` domains. These can initially print “not implemented yet”; **do not implement heavy logic in Phase 2**.

> Explicitly out-of-scope for Phase 2:
> - No changes to `~/.aikey/vault.db` schema or crypto logic.  
> - No implementation of org-level commands (`org` domain) or usage stats (`stats` domain).  
> - No implementation of advanced project config parsing, policies, or audit pipelines (stubs only at most).

---

### 2. Command Structure & Naming

- Primary executable name:
  - Recommended: `aikey` (use this in docs / README / examples).
  - Compatible: `ak` (same binary or user alias; keep working).

- Unified style: `aikey <domain> <action> [args] [options]`

  Examples:
  - `aikey profile list`
  - `aikey profile use dev`
  - `aikey env inject`
  - `aikey project init`

- Domains:
  - Nouns, singular: `profile`, `env`, `project`
- Actions:
  - Verbs: `list`, `use`, `show`, `init`, `inject`, `export`, `check`

---

### 3. Core Capabilities to Expose (Phase 2)

#### 3.1 Vault Basics (mapping from existing `ak` commands)

These commands **reuse existing implementations**; we only align the public surface under `aikey`:

| Current (approx) | Phase 2 recommended shell              | Notes |
|------------------|----------------------------------------|-------|
| `ak init`        | `aikey init`                           | Initialize vault (no internal logic changes) |
| `ak add`         | `aikey add <alias>`                    | Store a secret |
| `ak get`         | `aikey get <alias>`                    | Retrieve secret (clipboard semantics unchanged) |
| `ak list`        | `aikey list`                           | List aliases |
| `ak update`      | `aikey update <alias>`                 | Update secret |
| `ak delete`      | `aikey delete <alias>`                 | Delete secret |
| `ak exec`        | `aikey exec --env VAR=alias -- cmd`    | Inject env vars into a subprocess |

**Implementation requirements:**

- Use `clap` or current CLI framework so `aikey` and `ak` both map to the same logic.
- **Do not** change:
  - return codes semantics,
  - crypto parameters,
  - rate limiting,
  - audit behavior,
  - vault schema.

#### 3.2 `--json` Output (add where straightforward)

In Phase 2, we will start adding `--json` to a couple of key commands:

- `aikey list --json`
  - Output: JSON array, with at least:
    - `alias` (string)
    - Future extension fields are allowed (e.g. `createdAt`, `updatedAt`, `tags`).
- `aikey get <alias> --json`
  - Optional in Phase 2. If implemented:
    - Should NOT output the secret plaintext.
    - Example shape:  
      `{ "alias": "openai-api-key", "status": "ok" }`

> If implementing `--json` is complex for some commands, it is acceptable to leave TODOs and only implement where easy, as long as option names are reserved.

---

### 4. Phase 2 Shell Commands (Profile / Env / Project)

These commands can be very thin shells or TODO placeholders in Phase 2. The goal is to **lock in stable names**, not to implement full behavior.

#### 4.1 `aikey profile` domain (identity / environment)

> Goal: reserve stable command names for multi-profile support; behavior can be minimal in this phase.

- `aikey profile list`
  - Phase 2 behavior suggestion:
    - If no profile system exists yet, simply return:
      - Human mode: `Profiles are not implemented yet.`  
      - JSON: `[]`
    - Optionally: infer a pseudo-profile like `default` from current vault, if trivial.
- `aikey profile use <name>`
  - Phase 2 behavior:
    - Record `currentProfile = <name>` in a simple global config (e.g. JSON file), or reuse existing mechanism.
    - No deep impact on vault logic yet.
- `aikey profile show <name>`
  - Phase 2: may just print “not implemented yet” or a minimal stub.

> Requirement: **do not change vault schema** to support profiles in Phase 2. Use a simple config or placeholder recording instead.

#### 4.2 `aikey env` domain (environment / .env files)

> Goal: eventually support `env inject` / `env export` / `env check`. Phase 2 focuses on `inject` as a nicer front for `exec`.

- `aikey env inject`
  - Two options in Phase 2:
    1. **Thin wrapper:** call into existing `aikey exec` with a more convenient syntax; or  
    2. **Placeholder:** print a clear message like:  
       `Use 'aikey exec' for now. 'aikey env inject' will be implemented later.`
- `aikey env export`
  - Phase 2: stub only, returning “not implemented yet”.
- `aikey env check`
  - Phase 2: stub only, or a trivial check (e.g. required env vars present) if easy.

#### 4.3 `aikey project` domain (project config)

> Works with `aikey.config.json`. In Phase 2, this is mostly about generating a minimal template.

- `aikey project init`
  - Phase 2 behavior:
    - In current directory, generate a minimal `aikey.config.json`:
      - Contains `version`, `project.name`, `env.target`, `requiredVars` (empty array), `defaults.profile`.
    - No heavy interaction required.
- `aikey project status`
  - Phase 2 behavior:
    - Check if there is an `aikey.config.*` in current or parent dirs.
    - Print a simple status: “found” vs “not found”.

> These commands are about **reserving the contract**. Their behavior can be minimal but stable.

---

### 5. Hard Constraints for Implementers / Claude (Phase 2)

1. **Do NOT modify core crypto or storage:**
   - Do not change `crypto.rs` parameters or algorithms.
   - Do not change `storage.rs` vault schema (tables, columns, etc.) in Phase 2.

2. **Do NOT implement org-level / telemetry features:**
   - `aikey org *`, `aikey stats` must not implement real remote/auth/telemetry logic in Phase 2.
   - If present, they should return a clear “not implemented yet” message.

3. **Do NOT output secret plaintext in JSON:**
   - `--json` outputs may expose metadata only, never secret values.

---

### 6. README / Help Text Requirements

In CLI README and `--help` text:

- Use `aikey` as the primary command name, explain `ak` as an optional alias for power users.
- The list of documented commands should follow this Phase 2 spec.
- Clearly label `profile` / `env` / `project` commands as:
  - **“preview / experimental”** if behavior is minimal,  
  - while stating that their **names are stable** and will be extended in later versions.
