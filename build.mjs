import { writeFileSync } from 'fs';
import { render as renderEmc } from './emc.mjs';

writeFileSync('emc.json', renderEmc());

// Now that emc.json exists, we can build the emoji variant
const { render: renderEmoji } = await import('./🪧.mjs');
writeFileSync('🪧.json', renderEmoji());
