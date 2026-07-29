// Kimi Code hook: run `npm run update` when package.json is edited.
// Equivalent of .kiro/hooks/auto-npm-update.kiro.hook
//
// Registered in ~/.kimi-code/config.toml as:
//   [[hooks]]
//   event = "PostToolUse"
//   matcher = "Write|Edit"
//   command = "node <abs path to this file>"
//   timeout = 600
//
// Only fires when the edited package.json actually defines an "update" script,
// so it is safe to register globally — projects without one are ignored.
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
    if (path.basename(filePath) !== 'package.json') process.exit(0);
    const cwd = path.dirname(filePath);
    try {
        const pkg = JSON.parse(readFileSync(filePath, 'utf8'));
        if (!pkg.scripts?.update) process.exit(0);
    } catch {
        process.exit(0);
    }
    const child = spawn('npm run update', { cwd, shell: true, stdio: 'inherit' });
    child.on('close', (code) => process.exit(code ?? 0));
});
