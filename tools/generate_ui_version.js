const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const versionFile = path.join(repoRoot, 'ui', 'src', 'res', 'version.js');
const packageFile = path.join(repoRoot, 'ui', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));

function readValue(filePath, pattern, fallback) {
  try {
    const match = fs.readFileSync(filePath, 'utf8').match(pattern);
    return match ? match[1] : fallback;
  } catch (error) { return fallback; }
}
function pad2(value) { return String(value).padStart(2, '0'); }

const buildCode = (date => `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}`)(new Date());
const clib = process.env.LOLIAPP_CLIB || process.env.CLIB || readValue(versionFile, /export const clib = '([^']+)'/, 'glibc');
const isCvi = process.env.ISCVI !== undefined
  ? process.env.ISCVI === 'true'
  : readValue(versionFile, /export const isCvi = (true|false)/, 'false') === 'true';

const output =
  `export const nowVersion = '${pkg.version}';\n` +
  `export const buildCode = '${buildCode}';\n` +
  `export const clib = '${clib}';\n` +
  `export const updateDir = 'toolchains/${clib}';\n` +
  `export const appid = '${pkg.appid}';\n` +
  `export const pstoreBaseUrl = 'https://store.posc.net';\n` +
  `export const isCvi = ${isCvi};\n`;

fs.writeFileSync(versionFile, output, 'utf8');
process.stdout.write(`Generated ui version: version=${pkg.version} buildCode=${buildCode} appid=${pkg.appid}\n`);
