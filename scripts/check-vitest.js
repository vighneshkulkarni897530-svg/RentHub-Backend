const fs = require('fs');
const path = require('path');

console.log('Node:', process.version);

const base = path.resolve(__dirname, '..', 'node_modules');
const vitestPkg = require(path.join(base, 'vitest', 'package.json'));
console.log('vitest:', vitestPkg.version);

const vitestDir = path.join(base, '@vitest');
if (fs.existsSync(vitestDir)) {
  for (const name of fs.readdirSync(vitestDir)) {
    try {
      const p = require(path.join(vitestDir, name, 'package.json'));
      console.log('@vitest/' + name + ':', p.version);
    } catch (e) {
      console.log('@vitest/' + name + ': (error reading)', e.message);
    }
  }
} else {
  console.log('@vitest not found');
}

try {
  console.log('vite:', require(path.join(base, 'vite', 'package.json')).version);
} catch (e) {
  console.log('vite: (error reading)', e.message);
}
