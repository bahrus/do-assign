// Kimi Code hook: rebuild generated JSON configs when an emc *.mjs source is edited.
// Equivalent of .kiro/hooks/auto-build-config.kiro.hook
//
// Registered in ~/.kimi-code/config.toml as:
//   [[hooks]]
//   event = "PostToolUse"
//   matcher = "Write|Edit"
//   command = "node <abs path to this file>"
//   timeout = 15
//
// Kimi Code pipes a JSON event payload to stdin; PostToolUse is observation-only,
// so this script never blocks — it always exits 0 unless the build itself fails.
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
    let filePath = '';
    try {
        const payload = JSON.parse(input);
        filePath = payload.tool_input?.path ?? payload.tool_input?.file_path ?? '';
    } catch {
        process.exit(0); // fail-open: ignore unparseable payloads
    }
    const base = path.basename(filePath);
    // emc.mjs, or an emoji .mjs (file name starts with a non-ASCII char, e.g. 🔁.mjs)
    const isEmcSource = base === 'emc.mjs' || (base.endsWith('.mjs') && base.charCodeAt(0) > 127);
    if (!isEmcSource) process.exit(0);
    const cwd = path.dirname(filePath);
    // Only build when the project actually defines a build script.
    try {
        const pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8'));
        if (!pkg.scripts?.build) process.exit(0);
    } catch {
        process.exit(0);
    }
    const child = spawn('npm run build', { cwd, shell: true, stdio: 'inherit' });
    child.on('close', (code) => process.exit(code ?? 0));
});
