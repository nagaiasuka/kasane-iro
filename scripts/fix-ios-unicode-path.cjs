// RN 0.83 constructs file:// URLs from unescaped local artifact paths.
// Percent-encode them so CocoaPods also works in directories such as 開発.
// Keep this scoped to the affected RN helpers; do not change Ruby's global URI API.
const fs = require('node:fs');
const path = require('node:path');
const root = path.dirname(require.resolve('react-native/package.json'));
const before = 'URI::File.build(path: destinationDebug)';
const after = 'URI::File.build(path: URI::DEFAULT_PARSER.escape(destinationDebug))';
for (const name of ['rncore.rb', 'rndependencies.rb']) {
  const file = path.join(root, 'scripts', 'cocoapods', name);
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(before)) {
    fs.writeFileSync(file, source.split(before).join(after));
    console.log(`Fixed local file URL encoding in ${name}`);
  } else if (!source.includes(after)) {
    throw new Error(`Review the iOS Unicode path workaround for the installed React Native: ${name}`);
  }
}
// CocoaPods captures subprocess output as binary. Node emits UTF-8 paths;
// decode those before interpolating or comparing Japanese filesystem paths.
const hermesFile = path.join(root, 'sdks', 'hermes-engine', 'hermes-engine.podspec');
const hermesSource = fs.readFileSync(hermesFile, 'utf8');
const binaryPath = '__dir__]).strip';
const utf8Path = '__dir__]).force_encoding(Encoding::UTF_8).strip';
if (hermesSource.includes(binaryPath)) {
  fs.writeFileSync(hermesFile, hermesSource.split(binaryPath).join(utf8Path));
  console.log('Fixed Node output path encoding in hermes-engine.podspec');
} else if (!hermesSource.includes(utf8Path)) {
  throw new Error('Review the Hermes Unicode path workaround for the installed React Native');
}
