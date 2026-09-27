import  'assign-gingerly/object-extension.js';

/**
 * Registers do-assign's config with the enhancement registry, so it can be
 * attached programmatically via `enh.set.doAssign` or `enh.get(emc)`.
 * @param {Element | undefined} ref
 */
export async function defDoAssign(ref){
    const {default: emc} = await import('./emc.json', {with: {type: 'json'}});
    return await push(ref, emc);
}

async function push(ref, emc){
    const {DoAssign} = await import('./do-assign.js');
    const {enhConfig} = emc;
    enhConfig.spawn = DoAssign;
    enhConfig.customData = emc.customData;
    const registry = ref?.customElementRegistry ?? customElements;
    const {enhancementRegistry} = registry;
    enhancementRegistry.push(enhConfig);
    return enhConfig;
}
