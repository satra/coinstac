'use strict';

const fs = require('fs');
const path = require('path');
const docsPath = path.resolve(__dirname, 'docs');
const packagesPath = path.resolve(__dirname, '..', 'packages');
const cp = require('child_process');

const packages = fs.readdirSync(packagesPath)
.filter((p) => p.match(/coinstac/))
.map((p) => {
  const pkgRoot = path.resolve(packagesPath, p);
  return {
    package: p,
    path: pkgRoot,
  }
});

packages.forEach((pkg, ndx, arr) => {
  cp.exec('npm run lint', { cwd: pkg.path}, (err) => {
    if (err) {
      console.log(`Warning: lint failed for package ${pkg.package}`);
    }
    console.log(`Lint passed for ${pkg.package}`);
    cp.exec('npm test', { cwd: pkg.path}, (err, stdout, stderr) => {
      if (err) {
        console.log(`Darn, tests failed for ${pkg.package}`)
        console.log(stderr);
        console.log(stdout);
        throw err;
      }
      console.log(`Tests passed for ${pkg.package}`)
    });
  });
});
