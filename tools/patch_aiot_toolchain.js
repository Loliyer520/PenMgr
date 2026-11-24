const fs = require('fs');
const path = require('path');

const uiRoot = path.resolve(__dirname, '..', 'ui');
const repoRoot = path.resolve(uiRoot, '..');
function patch(relativePath, transform) {
  const file = path.join(uiRoot, relativePath);
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(file, after, 'utf8');
}

patch('node_modules/aiot-vue-cli/web-loaders/falcon-vue-loader/lib/parser.js', source =>
  source.replace("compiler.parseComponent(content, { pad: 'line' })", "compiler.parse(content, { pad: 'line' }).descriptor")
);
patch('node_modules/aiot-vue-cli/cli-libs/index.js', source =>
  source.replace(/path\.resolve\(__dirname, '\.\/vue\/packages\/vue-template-compiler\/(?:index|build)\.js'\)/g, "'@vue/compiler-sfc'")
);
patch('node_modules/aiot-vue-cli/src/libs/parser.js', source =>
  source.replace('compiler.parseComponent(content, { pad: true })', 'compiler.parse(content, { pad: true }).descriptor')
);
patch('node_modules/aiot-vue-cli/web-loaders/falcon-vue-loader/lib/template-compiler/index.js', source =>
  source.replace(/compiler\.compile(?:Template)?(?=\s*$)/gm, 'compiler.compileTemplate')
);
patch('node_modules/aiot-vue-cli/src/libs/rollup.config.js', source =>
  source.replace('const replaceValues = {}', "const replaceValues = { 'defineComponent': '' }")
);

// 酒馆只需 bridge 原生模块（Fetch/Datas/Shell），.so 产物随仓存放于 jsapi/produce
const requestedNativeTarget = String(
  process.env.LOLIAPP_NATIVE_TARGET ||
  (process.env.ISCVI === 'true' ? 's6' : 'x7')
).toLowerCase();
if (requestedNativeTarget !== 'x7' && requestedNativeTarget !== 's6') {
  throw new Error('Unsupported native target: ' + requestedNativeTarget);
}
for (const moduleName of ['bridge']) {
  const nativeSource = path.join(
    repoRoot,
    'jsapi',
    'produce',
    'libjsapi_' + moduleName + '_' + requestedNativeTarget + '.so'
  );
  const nativeTarget = path.join(uiRoot, 'libs', 'libjsapi_' + moduleName + '.so');
  if (!fs.existsSync(nativeSource)) {
    throw new Error('Missing ' + requestedNativeTarget.toUpperCase() + ' native library: ' + nativeSource);
  }
  fs.mkdirSync(path.dirname(nativeTarget), { recursive: true });
  fs.copyFileSync(nativeSource, nativeTarget);
}

process.stdout.write(
  'aiot-vue-cli patched and ' + requestedNativeTarget.toUpperCase() + ' native libraries synchronized\n'
);
