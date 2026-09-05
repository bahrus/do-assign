# Add Security

## Bruce's Ask

I just updated assign-gingerly, with an export [default assignPermissions configuration](https://github.com/bahrus/assign-gingerly/blob/baseline/docs/assign-permissions.md#strict-default-profile-strictdefaultpermissions) to disallow reckless assignments.

Please employ that exported configuration for added security for this enhancement, and update the README.md to explain the restrictions, and add your implementation notes below.

## Implementation Notes

- [do-assign.js](../do-assign.js) now imports `strictDefaultPermissions` from `assign-gingerly/DX/strictDefaultPermissions.js` and builds a module-level `PermissionProcessor` from it (constructing it once, since the profile is static config, not per-invocation state).
- That `permissionProcessor` is passed as the 6th argument to `attachEventListener(...)` in `hydrate()`, so every assignment made when a `do-assign` event fires — `toTarget`/`toHost`/`toLHS`, shorthand, and `fromLHS`/`fromHost`/`fromTarget`/`fromEvent` vectors — is routed through the same restricted-props/restricted-methods checks.
- README.md gained a "Security" section summarizing what the strict profile blocks (markup/CSS sinks, cross-origin URLs, inline event-handler attributes, HTML-injection methods) and linking to assign-gingerly's own docs for consumers who need to extend the profile.
- Updated `package.json`'s `assign-gingerly` dependency to `0.0.95`, since the first published `0.0.94` release was missing the compiled `DX/strictDefaultPermissions.js` (only the `.ts` source was in the package — every sibling file in `DX/` ships both). That surfaced as a 404 on the browser's dynamic import and a silent failure of the whole `do-assign.js` module load; fixed upstream by rebuilding assign-gingerly with the corrected tsconfig, then `npm run update` here picked up `0.0.95`.
- Verified via `npx playwright test` (`tests/BasicExample.spec.mjs`, `tests/EmojiExample.spec.mjs`) — both pass with the permission processor wired in, confirming ordinary property assignments (`isHappy =!`, `age +=`) still work under the strict profile and nothing in the existing demos/tests touches a now-restricted sink.