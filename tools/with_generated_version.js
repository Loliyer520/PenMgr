const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const versionFile = path.join(repoRoot, 'ui', 'src', 'res', 'version.js');
const generator = path.join(__dirname, 'generate_ui_version.js');
const [command, ...args] = process.argv.slice(2);

if (!command) {
  process.stderr.write('Usage: node tools/with_generated_version.js <command> [args...]\n');
  process.exit(2);
}

const original = fs.readFileSync(versionFile);
let status = 1;
try {
  const generated = spawnSync(process.execPath, [generator], { cwd: repoRoot, env: process.env, stdio: 'inherit' });
  if (generated.status !== 0) status = generated.status || 1;
  else {
    const child = spawnSync(command, args, { cwd: process.cwd(), env: process.env, shell: process.platform === 'win32', stdio: 'inherit' });
    if (child.error) process.stderr.write(`${child.error.message}\n`);
    status = child.status === null ? 1 : child.status;
  }
} finally {
  fs.writeFileSync(versionFile, original);
}
process.exit(status);
