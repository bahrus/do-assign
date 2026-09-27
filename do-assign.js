// @ts-check
/** @import {Actions, PAP, AllProps, AP} from './types/do-assign/types' */;
/** @import {RoundaboutOptions} from './types/roundabout/types' */;
/** @import {ElementEnhancementGateway, SpawnContext} from './types/assign-gingerly/types' */;
/** @import {EMC} from './types/mount-observer/types' */;
/** @import {RAConfig} from './types/roundabout/types' */;

import {strictDefaultPermissions} from 'assign-gingerly/DX/strictDefaultPermissions.js';
import {PermissionProcessor} from 'assign-gingerly/assignPermissions/PermissionProcessor.js';

/**
 * do-assign lets HTML attributes drive assignGingerly's full withMethods /
 * akaMethods power (see the addEventListener handler below). That power is
 * safe when the attribute markup is trusted, but do-assign has no way to
 * know that at runtime, so it applies assign-gingerly's strict default
 * permissions profile (blocks innerHTML/outerHTML, javascript:/data: URLs,
 * inline event-handler attributes, insertAdjacentHTML, etc.) to every
 * assignment it makes. See assign-gingerly's docs/assign-permissions.md
 * ("strict default profile") for what this profile allows and blocks, and
 * README.md's "Security" section for how to opt into a looser policy.
 */
const permissionProcessor = new PermissionProcessor(strictDefaultPermissions);

/**
 * @implements {Actions}
 */
class DoAssign {

    /**
     * @this {AllProps & Actions}
     * @param {Element & ElementEnhancementGateway} enhancedElement
     * @param {SpawnContext} ctx
     * @param {PAP} initVals
     */
    constructor(enhancedElement, ctx, initVals){
        this.init(this, enhancedElement, ctx, initVals);
    }

    /**
     * @param {AllProps} self
     * @param {Element & ElementEnhancementGateway} enhancedElement
     * @param {SpawnContext} ctx
     * @param {PAP} initVals
     */
    async init(self, enhancedElement, ctx, initVals){
        const {customData} = /** @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions>>} */ (ctx.emc || ctx.config);
        /**
         * @type {RoundaboutOptions}
         */
        const raOptions = {
            ...customData,
            vm: self,
            initialPropVals: {
                enhancedElement,
                ...customData?.defaultPropVals,
                ...initVals
            }
        };
        await (await import('roundabout-lib/roundabout.js')).roundabout(raOptions);
        self.initialized = true;
    }

    /** @type {AbortController | undefined} */
    #ac;

    /**
     * @param {AP} self
     */
    async hydrate(self){
        // Re-hydrating (assignConfig or host reassigned) replaces the
        // listeners from the previous pass rather than stacking on them.
        this.#ac?.abort();
        const ac = this.#ac = new AbortController();
        const {enhancedElement, assignConfig, host: hostId} = self;

        // Find the host that the (shorthand) assignments merge into:
        // closest [itemscope] ancestor, shadow host, or peer element by id.
        const {upSearch} = await import('assign-gingerly/inferencer/upSearch.js');
        const host = /** @type {any} */ (await upSearch(enhancedElement, hostId));

        const {attachEventListener} = await import('assign-gingerly/handlers/addEventListener.js');
        const {akaMethods, aka, builtInEmoji} = await import('assign-gingerly/DX/emojis.js');
        /**
         * @type {any}
         */
        const options = {
            akaMethods,
            withMethods: ['appendChild'],
            aka: {
                ...aka,
            },
            handlers: builtInEmoji,
        };
        const configs = Array.isArray(assignConfig) ? assignConfig : [assignConfig];
        for(const config of configs){
            // Unless the config manages its own listener lifetime (a dedup key
            // or its own abortController), tie it to this hydrate pass.
            // Copied, so a caller-supplied config object is never mutated.
            const get = config.get ?? {};
            const configWithAC = (get.key || get.abortController)
                ? config
                : {...config, get: {...get, abortController: ac}};
            // toTarget and toHost both resolve to the host: there is no
            // separate "target" in this enhancement's context.
            attachEventListener(enhancedElement, configWithAC, host, host, options, permissionProcessor);
        }

        return /** @type {PAP} */ ({resolved: true});
    }
}

export {DoAssign};
