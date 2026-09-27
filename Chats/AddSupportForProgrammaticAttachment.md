# Add Support For Programmatic Attachment

## Bruce's Ask

Can you please follow the example of [be-persistent](https://github.com/bahrus/be-persistent) and [be-bound](../../be-bound) and [be-calculating](../../be-calculating/) and [the addendum](../types/ImportantEnhancementAddendum.md) to add demos and adjust do-assign.js as needed and add def.js to support programmatic attachment of this enhancement?

Please add your implementation notes below.

## Implementation Notes

I followed the addendum's checklist, including step 6 (README wording), with
the previous enhancements as models.

do-assign needed the least of any so far. `assignConfig` is already a plain
object (or array) with the same shape as assign-gingerly's
`AddEventListenerConfig`. The attribute's JSON parses straight into it, so
programmatic callers set it directly and no new property was needed.

### Addendum steps

1. **`init()` sets `self.initialized = true`** after the (already awaited)
   `roundabout(...)`. `hydrate` now uses
   `ifKeyIn: ['assignConfig', 'host', 'initialized'], ifAllOf: ['assignConfig', 'enhancedElement', 'initialized']`.
2. **`ctx.emc || ctx.config`.** This was the blocker. Without it,
   `customData` was undefined on the programmatic path, so no actions were
   configured and `hydrate` never ran.
3. **`def.js`** exports `defDoAssign(ref)`. `package.json` has no `exports`
   map and no `files` field, so `do-assign/def.js` already resolves and is
   already published. I deliberately did **not** add an `exports` map. Doing
   so would block every deep import it doesn't list.
4. **Reserved names.** There are no collisions. `host` has no default, so it
   was never at risk of being overwritten. I listed it in `hydrate`'s
   `ifKeyIn` anyway, so roundabout monitors it and reassigning it re-hydrates.
5. **Tests.** See below.
6. **README.** Added a "Programmatic attachment (no attribute)" section after
   "Security". It has the editorial intro (the "less clunky" point leans on
   the fragility of JSON-in-an-attribute), registration, an attribute →
   property table, and both patterns. It also notes that the strict
   permissions profile applies equally to programmatic configs.

### Reassigning `assignConfig` replaces listeners

`hydrate` never tore anything down. Each run added another listener, so a
second assignment of `assignConfig` would stack a second click handler. On
the attribute path that rarely happens, but frameworks re-render with new
props all the time.

`hydrate` now owns an `AbortController`. It aborts the previous one at the
start of each pass and passes the new one to `attachEventListener` as
`get.abortController`. That's the hook assign-gingerly already provides.

- It does this on a *copy* of each config, so caller-supplied objects are
  never mutated.
- If a config sets its own `get.key` (assign-gingerly's dedup) or
  `get.abortController`, it's left alone.

### Demos and tests

These reuse the `<mood-stone>` fixture from Example 1a / `BasicExample`:

- `demo/Programmatic/DeclarativeInSequence.html`: Example 1a via `enh.set`.
- `demo/Programmatic/DeclarativeOutOfSequence.html`: the same, set before
  `defDoAssign`.
- `demo/Programmatic/Imperative.html`: `enh.get()` with `host: 'moodStone'`,
  a peer rather than an `[itemscope]` ancestor. This covers the
  `do-assign-host` equivalent.
- `demo/Programmatic/ImperativeReassign.html`: assigns
  `{"?.age +=": 10}`, then reassigns `{"?.age +=": 1}`. The test clicks
  twice and expects `age === 2`. With stacked listeners it would be `22`.
- `tests/Programmatic/*` mirror these.

All 6 Playwright tests pass: the 2 existing ones and the 4 new ones. Checks
that the new tests catch real problems:

- With the original `do-assign.js` / `emc.json`, all 4 fail.
- With only the `abort()` call disabled, `ImperativeReassign` fails.

### Other changes

- `types/do-assign/types.d.ts` (in the `types` git submodule): added
  `initialized` and updated the `assignConfig` doc comment. **These edits
  need to be committed and pushed in the `types` submodule separately.**
- `emc.json` / `🪧.json` were regenerated with `npm run build`.

