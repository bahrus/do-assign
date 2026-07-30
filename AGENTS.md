# AGENTS.md — do-assign

Guidance for AI agents (Kimi and others) working in this repository. This file is the
Kimi-compatible equivalent of the Kiro steering/spec files found in the shared `types`
submodule (`types/.kiro/`), plus the deltas discovered while building this project.

## What this project is

`do-assign` (emoji shorthand `🪧`) is a DOM **element enhancement** (not a custom element)
that merges values into a host custom element (or remote peer element) when an event fires
on the adorned element. See `README.md` for the user-facing contract. It is a thin wrapper
around assign-gingerly's **event-binding** feature — all assignment operators (`=!` toggle,
`+=` increment, method calls), source vectors (`fromLHS`/`fromHost`/`fromTarget`/`fromEvent`),
destinations (`toHost`/`toTarget`/`toLHS`), and `get` options (dispatch, stopPropagation,
preventDefault, nudge, dedup keys) come from assign-gingerly for free.

Architecture (the "modern" stack, same as three-peat / be-calculating / be-observing):

- **be-hive** + **mount-observer** — observe the DOM for the enhancement attribute and spawn
  the enhancement class. Configuration is declarative JSON (`emc.json`, `🪧.json`) referenced
  from HTML via `<be-hive><script type=emc src="do-assign/emc.json"></script></be-hive>`.
- **roundabout-lib** — reactive property wiring inside the enhancement class (actions run
  when their `ifAllOf` props are available).
- **assign-gingerly** — does the real work:
  - `assign-gingerly/inferencer/upSearch.js` finds the host (closest `[itemscope]`, else
    shadow-root host; with an id, `getElementById` within the same root node).
  - `assign-gingerly/handlers/addEventListener.js` (`attachEventListener(lhs, config,
    target, host, inheritedOptions)`) attaches the listener and executes the assignment
    vectors on each event.

## File map

```
do-assign/
├── do-assign.js         # Enhancement class (browser code, @ts-check + JSDoc types)
├── emc.mjs              # SOURCE OF TRUTH for emc.json — edit this, never the .json
├── 🪧.mjs               # SOURCE OF TRUTH for 🪧.json (imports emc.json, overrides base/enhKey)
├── build.mjs            # node build.mjs → writes emc.json, then 🪧.json (order matters!)
├── emc.json / 🪧.json   # GENERATED — never edit by hand
├── imports.html         # Import map, pulled into test pages via SSI include
├── playwright.config.ts # Chromium only (needs Chrome 146+ JSON import assertions)
├── tests/               # *.html fixture + *.spec.mjs twin, "mark=good" idiom
├── demo/                # Example pages referenced from the README
├── .kiro/hooks/         # Kiro agent hooks (auto-build, auto npm update)
├── .kimi-code/hooks/    # Kimi Code equivalents — see "AI assistant hooks" below
└── types/               # git submodule shared across all enhancements — be careful
    ├── do-assign/types.d.ts           # this project's types (EndUserProps/AllProps/Actions)
    └── assign-gingerly/types.d.ts     # shared library types (AddEventListenerConfig etc.)
```

## Build pipeline rules (from types/.kiro/steering/coding-standards.md)

1. **NEVER edit `emc.json` / `🪧.json` directly** — they are generated artifacts.
2. Edit `emc.mjs` (or `🪧.mjs`), then run `npm run build`.
3. The emoji `.mjs` must spread `...myJSON` at the top level, or `customData`
   (actions/weakRef/defaultPropVals) is silently dropped and the enhancement loads but
   never reacts.
4. `build.mjs` writes `emc.json` **before** dynamically importing `🪧.mjs` (the emoji
   module does `import myJSON from './emc.json' with {type: 'json'}` — a static import
   would race).
5. Neither `.mjs` calls `console.log(render())` — `build.mjs` imports them, so a
   console.log would print the JSON to the build output.

## Coding standards

- `*.mjs` only for npm build scripts; `*.js` for all browser code.
- `// @ts-check` at the top of every browser file; types come from the `types` submodule
  via `/** @import {...} from './types/<pkg>/types' */` JSDoc comments.
- Import maps use bare specifiers with trailing `/` mapped to `/node_modules/<pkg>/`;
  the project maps itself as `"do-assign/": "/"`.
- Enhancement class: plain class, no base class. Constructor signature
  `(enhancedElement, ctx, initVals)` delegates to `init(this, ...)`, which builds
  `RoundaboutOptions` from `ctx.emc.customData` and calls `roundabout()`. Action methods
  take `(self)` and return partial props (`PAP`). Never import `emc.json` in the class —
  config arrives via `ctx.emc`.
- `enhancedElement` is WeakRef'd via `customData.weakRef.properties`; roundabout wraps and
  unwraps it — action code just uses it directly and returns raw element references.

## withAttrs attribute mapping

In `emc.mjs`, `enhConfig.withAttrs`:

```js
withAttrs: {
    base: 'do-assign',                          // the marker attribute
    _base: { mapsTo: 'assignConfig',            // the base attr value itself: JSON → prop
             instanceOf: 'Object' },            // JSON.parsed (object or array of configs)
    host: '${base}-host',                       // string template → attr name, prop = key, String
}
```

- `${base}` interpolates the base attribute name. Use kebab-case attribute names —
  HTML lowercases attribute names at parse time.
- `instanceOf: 'Object' | 'Array'` → attribute value is JSON.parsed; `'Boolean'` →
  presence check; default is String identity.
- The `do-assign` attribute value must be **valid JSON** (double quotes, commas — the
  README's Example 1a is missing a comma after `"on": "click"`; the tests use valid JSON).
  An array of config objects is also accepted.

## do-assign specifics

- `hydrate(self)` does: `upSearch(enhancedElement, hostId)` for the host →
  `attachEventListener(enhancedElement, config, host, host, options)` per config
  (single object or array). Both `target` and `host` are the host element — there is no
  separate "target" in this enhancement's context, so `toTarget` ≡ `toHost`.
- Default options (per README): `{ akaMethods, withMethods: ['appendChild'],
  aka: {...aka}, handlers: builtInEmoji }` from `assign-gingerly/DX/emojis.js`.
- The attribute is the only configuration vector, so `hydrate` simply gates on
  `ifAllOf: ['assignConfig', 'enhancedElement']` — no `initialized` flag needed
  (that pattern from three-peat is only required when multiple attributes must all be
  read before the action runs).

### Notes on assign-gingerly 0.0.68

- `emojis.js` moved: import `{ akaMethods, aka, builtInEmoji }` from
  `assign-gingerly/DX/emojis.js` (the README's `assign-gingerly/emojis.js` path is stale).
- `handlers/addEventListener.js` is **not** in the package.json `exports` map (neither is
  `inferencer/upSearch.js`) — they resolve through the browser import map, which is all
  this project targets.
- Runtime quirks of `attachEventListener` (0.0.68): top-level `nudge` in a config is
  ignored (only `get.nudge` works); top-level `dispatch` works; `get.abortController`
  only honors an actual `AbortController` instance (string paths are not resolved);
  `toTargetOptions`/`toHostOptions`/`toLHSOptions` are reserved but unimplemented —
  use `withOptions` per vector instead.

## AI assistant hooks (.kiro and .kimi-code)

This project keeps hook definitions for both assistants, so it stays AI-neutral:

- `.kiro/hooks/*.kiro.hook` — Kiro agent hooks (`fileEdited` on `emc.mjs`/`🪧.mjs` →
  `npm run build`; `fileEdited` on `package.json` → `npm run update`).
- `.kimi-code/hooks/*.mjs` — the Kimi Code equivalents. Kimi Code has no `fileEdited`
  event; the nearest equivalent is a `PostToolUse` hook (observation-only, fail-open)
  matching the `Write`/`Edit` tools. The script inspects the edited file's path from the
  stdin JSON payload and acts only when relevant:
  - `auto-build.mjs` — edited file is `emc.mjs` or an emoji `.mjs` → `npm run build`
    in that file's directory (only if the project defines a `build` script).
  - `auto-npm-update.mjs` — edited file is `package.json` → `npm run update`
    (only if the project defines an `update` script, so it's safe to register globally).

Kimi Code hooks are registered in the **user-level** `~/.kimi-code/config.toml` (there is
no project-local hook file; `.kimi-code/local.toml` is machine-specific workspace config
and should stay gitignored — the `hooks/` scripts, by contrast, are meant to be committed).
To activate:

```toml
# ~/.kimi-code/config.toml
[[hooks]]
event = "PostToolUse"
matcher = "Write|Edit"
command = "node C:/git/binding/do-assign/.kimi-code/hooks/auto-build.mjs"
timeout = 15

[[hooks]]
event = "PostToolUse"
matcher = "Write|Edit"
command = "node C:/git/binding/do-assign/.kimi-code/hooks/auto-npm-update.mjs"
timeout = 600
```

Notes:

- The scripts are project-agnostic (they act on whatever file was edited, in that file's
  directory), so one registration covers all sibling enhancement projects.
- Hooks take effect for **new sessions** (or after `/reload`).
- Unlike Kiro's filesystem watcher, `PostToolUse` only fires on edits made through the
  agent's tools — manual saves in an external editor don't trigger it.
- Docs: https://www.kimi.com/code/docs/en/kimi-code-cli/customization/hooks.html

## Testing

- `npm run serve` → spa-ssi on port 8000 (processes the
  `<!-- #include virtual="/imports.html" -->` directive in test pages).
- `npm run test` → playwright, **Chromium only** (JSON import assertions need Chrome 146+).
- Test idiom: an `.html` fixture + a `.spec.mjs` twin. The page sets
  `target.setAttribute('mark', 'good')` after a timeout when the assertion holds; the spec
  waits and does `await expect(page.locator('#target')).toHaveAttribute('mark', 'good')`.
- Current tests: `BasicExample` (the `do-assign` attribute, README Example 1a) and
  `EmojiExample` (the `🪧` attribute + `🪧.json` pipeline).

## Common pitfalls (from types/.kiro + experience)

- Same method in both `actions` and `compacts` of `customData` → roundabout
  "Conflict detected" error. Pick one trigger mechanism per method.
- Missing `...myJSON` spread in `🪧.mjs` → enhancement loads but is inert.
- Attribute values needing dot paths: use `?.` (parsers split statements on plain `.`).
- Utility imports come from `be-hive/...`, `assign-gingerly/...`, never legacy
  `trans-render/...` paths.
- After editing any `.mjs`: `npm run build`, then sanity-check the generated JSON.
- Invalid JSON in the attribute (single quotes, missing commas) silently kills the
  enhancement — check the browser console for JSON.parse errors.

## Creating another new enhancement (Kimi checklist)

Full guide: `types/NewEnhancementInstructions.md` (Kiro-oriented but accurate). Condensed:

1. `package.json` (exact versions; scripts: `build: node build.mjs`, `serve`, `test`) +
   `types` submodule + `npm install`.
2. `types/<name>/types.d.ts`: `EndUserProps`, `AllProps extends EndUserProps`
   (`enhancedElement`, `resolved?`), `AP/PAP/ProPAP` aliases, `Actions` (`init` 4-arg,
   plus one action per behavior).
3. `emc.mjs` (`enhKey`, `spawn: '<name>/<name>.js'`, `withAttrs`, `customData` with
   `weakRef.properties: ['enhancedElement']` and `actions`), `[emoji].mjs` if applicable,
   `build.mjs`; run `npm run build` and inspect the JSON.
4. `<name>.js` — plain class per the pattern above; keep logic in small `(self)` actions.
5. `imports.html`, `playwright.config.ts` (chromium only), `.vscode/settings.json`.
6. Hooks for AI neutrality: `.kiro/hooks/auto-build-config.kiro.hook` +
   `auto-npm-update.kiro.hook`, and the Kimi Code equivalents in `.kimi-code/hooks/`
   (see "AI assistant hooks" above — copy the two `.mjs` scripts verbatim).
7. Tests: one html+spec pair per scenario, `mark=good` idiom. Build incrementally:
   basic case → inference → custom events → remote/peer targeting.
