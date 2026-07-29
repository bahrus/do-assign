# AGENTS.md — three-peat

Guidance for AI agents (Kimi and others) working in this repository. This file is the
Kimi-compatible equivalent of the Kiro steering/spec files found in the shared `types`
submodule (`types/.kiro/`), plus the deltas discovered while building this project.

## What this project is

`three-peat` (emoji shorthand `🔁`) is a DOM **element enhancement** (not a custom element)
that manages an HTML template list: it repeats a template once per item of a list obtained
from a host element. See `README.md` for the user-facing contract.

Architecture (the "modern" stack, same as be-calculating / be-observing / be-switched):

- **be-hive** + **mount-observer** — observe the DOM for the enhancement attribute and spawn
  the enhancement class. Configuration is declarative JSON (`emc.json`, `🔁.json`) referenced
  from HTML via `<be-hive><script type=emc src="three-peat/emc.json"></script></be-hive>`.
- **roundabout-lib** — reactive property wiring inside the enhancement class (actions run
  when their `ifAllOf` props are available).
- **assign-gingerly** — does the real work:
  - `assign-gingerly/inferencer/upSearch.js` finds the host (closest `[itemscope]`, else
    shadow-root host; with an id, `getElementById` within the same root node).
  - `assign-gingerly/handlers/manageTemplateList.js` clones the template per item and
    reconciles the list by key on updates (markers, hidden/forget, in-place updates).

## File map

```
three-peat/
├── three-peat.js        # Enhancement class (browser code, @ts-check + JSDoc types)
├── emc.mjs              # SOURCE OF TRUTH for emc.json — edit this, never the .json
├── 🔁.mjs               # SOURCE OF TRUTH for 🔁.json (imports emc.json, overrides base/enhKey)
├── build.mjs            # node build.mjs → writes emc.json, then 🔁.json (order matters!)
├── emc.json / 🔁.json   # GENERATED — never edit by hand
├── imports.html         # Import map, pulled into test pages via SSI include
├── playwright.config.ts # Chromium only (needs Chrome 146+ JSON import assertions)
├── tests/               # *.html fixture + *.spec.mjs twin, "mark=good" idiom
├── .kiro/hooks/         # Kiro agent hooks (auto-build, auto npm update)
├── .kimi-code/hooks/    # Kimi Code equivalents — see "AI assistant hooks" below
└── types/               # git submodule shared across all enhancements — be careful
    ├── three-peat/types.d.ts        # this project's types (EndUserProps/AllProps/Actions)
    └── assign-gingerly/types.d.ts   # shared library types
```

## Build pipeline rules (from types/.kiro/steering/coding-standards.md)

1. **NEVER edit `emc.json` / `🔁.json` directly** — they are generated artifacts.
2. Edit `emc.mjs` (or `🔁.mjs`), then run `npm run build`.
3. The emoji `.mjs` must spread `...myJSON` at the top level, or `customData`
   (actions/weakRef/defaultPropVals) is silently dropped and the enhancement loads but
   never reacts.
4. `build.mjs` writes `emc.json` **before** dynamically importing `🔁.mjs` (the emoji
   module does `import myJSON from './emc.json' with {type: 'json'}` — a static import
   would race).

## Coding standards

- `*.mjs` only for npm build scripts; `*.js` for all browser code.
- `// @ts-check` at the top of every browser file; types come from the `types` submodule
  via `/** @import {...} from './types/<pkg>/types' */` JSDoc comments.
- Import maps use bare specifiers with trailing `/` mapped to `/node_modules/<pkg>/`;
  the project maps itself as `"three-peat/": "/"`.
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
    base: 'three-peat',                 // the marker attribute
    listProp: '${base}-list-prop',      // string template → attr name, prop = key, String
    each: '${base}-each',               // needs non-String parsing? add an underscore twin:
    _each: { instanceOf: 'Object' },    // config for `each` (mapsTo defaults to 'each')
}
```

- `${base}` interpolates the base attribute name. Use kebab-case attribute names —
  HTML lowercases attribute names at parse time, so camelCase attributes written in HTML
  would never match. (The README's `🔁-listProp` spelling only survives if set via
  `setAttribute` from JS; prefer `🔁-list-prop`.)
- `instanceOf: 'Object' | 'Array'` → attribute value is JSON.parsed; `'Boolean'` →
  presence check; default is String identity.
- Custom string DSLs use `parser: 'parse-pattern-statements'` + `parserConfig`, and then
  every HTML page must register the parser:
  `<script type=emc-parser src="be-hive/parsers/parse-pattern-statements.js" parser-name=parse-pattern-statements></script>`
  plus `wait-for-parsers=parse-pattern-statements` on the `<script type=emc>` tag.

## three-peat specifics

- `hydrate(self)` does: `upSearch` for the host → build a `<template>` from the adorned
  element's first child (or use the adorned element directly if it *is* a template) →
  `new ManageTemplateListHandler({do: 'builtIns.manageTemplateList', fromEachItem})` →
  `handler.assign(targetEl, {forEach, instantiate}, {from: host})` → subscribe for updates.
- Default `fromEachItem` is `{withOptions: {infer: {byItemprop: true}}}` — item properties
  flow into the clone's `[itemprop]` descendants with zero configuration.
- Update subscription: `three-peat-update-on` → plain `host.addEventListener(updateOn)`;
  else `three-peat-list-prop` → `host.propagator` if it's an EventTarget, else
  `new Infer(host, listProp).getPropagator()`; event name === listProp.
- Hosts built with `assign-gingerly/DX/IterableMixin.js`
  (`class MyElement extends IterableMixin()(HTMLElement)`) keep the list in a private
  field and expose statics: `MyElement.getItems(instance)` / `setItems(instance, items)`
  / `assignTo(instance, rhs)`; `setItems` dispatches an `items-changed` event on the
  instance. three-peat detects the static `getItems` on the host's constructor, uses it
  as the list source, and subscribes to `items-changed` (when neither `-list-prop` nor
  `-update-on` is given). See `tests/BasicExample.html` for the canonical usage.

### Notes on assign-gingerly 0.0.67

- README said `inference/upSearch.js`; the real path is
  `assign-gingerly/inferencer/upSearch.js` (fixed in the README).
- Per-item distribution config key is `toClone` (with `fromHost` for host-level data) —
  0.0.67 aligned the runtime with the docs; the brief `assignToFragment`/`fromSource`
  naming in 0.0.64 is gone. The shared types in `types/assign-gingerly/types.d.ts` match
  the shipped 0.0.67 types.
- The "generic class mixin" the README mentions is real as of 0.0.67:
  `assign-gingerly/DX/IterableMixin.js` (see above).

## AI assistant hooks (.kiro and .kimi-code)

This project keeps hook definitions for both assistants, so it stays AI-neutral:

- `.kiro/hooks/*.kiro.hook` — Kiro agent hooks (`fileEdited` on `emc.mjs`/`🔁.mjs` →
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
command = "node C:/git/binding/three-peat/.kimi-code/hooks/auto-build.mjs"
timeout = 15

[[hooks]]
event = "PostToolUse"
matcher = "Write|Edit"
command = "node C:/git/binding/three-peat/.kimi-code/hooks/auto-npm-update.mjs"
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
- Shadow-DOM test pages put `<be-hive></be-hive>` inside the declarative shadow template;
  the emc script stays in the document-level `<be-hive>`.

## Common pitfalls (from types/.kiro + experience)

- Same method in both `actions` and `compacts` of `customData` → roundabout
  "Conflict detected" error. Pick one trigger mechanism per method.
- Missing `...myJSON` spread in `🔁.mjs` → enhancement loads but is inert.
- Attribute values needing dot paths: use `?.` (parsers split statements on plain `.`).
- Utility imports come from `be-hive/...`, `assign-gingerly/...`, never legacy
  `trans-render/...` paths.
- After editing any `.mjs`: `npm run build`, then sanity-check the generated JSON.

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
