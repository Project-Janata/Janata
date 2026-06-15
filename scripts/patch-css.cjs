const fs = require('fs');
const path = require('path');

function patchFile(filePath, pattern, replacement) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log('Not found:', filePath);
      return false;
    }
    let c = fs.readFileSync(filePath, 'utf8');
    if (c.includes(pattern)) {
      c = c.replace(pattern, replacement);
      fs.writeFileSync(filePath, c);
      console.log('Patched:', filePath);
      return true;
    }
    return false;
  } catch (e) {
    console.log('Error:', e.message);
    return false;
  }
}

const rootDir = process.cwd();

// Find all copies of react-native-css-interop
const dirs = [
  rootDir + '/node_modules/react-native-css-interop',
  rootDir + '/node_modules/nativewind/node_modules/react-native-css-interop',
  rootDir + '/packages/frontend/node_modules/react-native-css-interop'
];

for (const dir of dirs) {
  // Fix source TS file
  const srcFile = dir + '/src/css-to-rn/parseDeclaration.ts';
  patchFile(srcFile, 
    'case "box-shadow": {\n      parseBoxShadow(declaration.value, parseOptions);\n    }',
    'case "box-shadow": {\n      return;\n    }'
  );
  
  // Fix compiled JS file  
  const jsFile = dir + '/dist/css-to-rn/parseDeclaration.js';
  patchFile(jsFile,
    'case "box-shadow": {\n            parseBoxShadow(declaration.value, parseOptions);\n          }',
    'case "box-shadow": {\n            return;\n          }'
  );
}

console.log('Done patching box-shadow');

// React Native 0.83.4's included Gradle build pins foojay-resolver-convention
// 0.5.0, which references JvmVendorSpec.IBM_SEMERU. Gradle 9 removed that
// symbol, so local Android builds fail unless the resolver is bumped.
const rnGradleSettings = path.join(
  rootDir,
  'node_modules/@react-native/gradle-plugin/settings.gradle.kts'
);
patchFile(
  rnGradleSettings,
  'id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")',
  'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")'
);

console.log('Done patching React Native Gradle toolchain resolver');
