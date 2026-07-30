# Create The Enhancement

---

## Human Ask

Please create the do-assign enhancement as described in [README](/README.md), and carefully following the instructions found in [New Enhancement Instructions](/types/NewEnhancementInstructions.md)

---

## Implementation Notes

The do-assign enhancement is built and verified — both Playwright tests pass.

**What was created**, following `types/NewEnhancementInstructions.md` and the three-peat reference architecture:

- `types/do-assign/types.d.ts` — `EndUserProps` (`assignConfig`, `host?`), `AllProps`, `AP/PAP/ProPAP`, `Actions`
- `emc.mjs` → `emc.json` and `🪧.mjs` → `🪧.json` (generated via `build.mjs`; `_base` maps the attribute JSON to `assignConfig` with `instanceOf: 'Object'`, so a single config object or an array works)
- `do-assign.js` — plain-class enhancement: `hydrate` resolves the host via `assign-gingerly/inferencer/upSearch.js` (closest `[itemscope]`, shadow host, or peer id from `do-assign-host`), then calls assign-gingerly's `attachEventListener` per config with the README's default options (`akaMethods`, `withMethods: ['appendChild']`, `aka`, `handlers: builtInEmoji`). Everything else — `=!`, `+=`, `fromLHS/fromHost/fromEvent`, `toHost/toLHS`, dispatch, stopPropagation, nudge — comes from assign-gingerly for free
- `imports.html`, `playwright.config.ts` (Chromium only), `.vscode/settings.json`, `.kimi-code/hooks/` pair, fixed emoji in the Kiro hook, `demo/Example1a.html`, and `AGENTS.md` rewritten for do-assign
- Tests: `tests/BasicExample` (README Example 1a — click toggles `isHappy`, `age += 10`) and `tests/EmojiExample` (validates the `🪧` attribute + `🪧.json` pipeline)

**Worth knowing:**

- A prior session had already scaffolded and committed most of these files; my independent rewrite matched it almost exactly. The only code deltas are mine: removed the `console.log(render())` noise from `emc.mjs`/`🪧.mjs`, the new tests/demo, the `.gitignore` addition for Playwright artifacts, and the `AGENTS.md` rewrite.
- The registered Kimi auto-update hook fired when I wrote `package.json` and bumped `assign-gingerly` to **0.0.68**. In that version `emojis.js` moved to `assign-gingerly/DX/emojis.js` — the README's import path (`assign-gingerly/emojis.js`) is now stale; the class and `AGENTS.md` use the new path.
- The README's Example 1a JSON is invalid (missing comma after `"on": "click"`); the tests use corrected JSON. You may want to fix the README snippet.

Nothing is committed — `git status` shows the modified/untracked files above if you want to review before committing.

