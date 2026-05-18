'use strict';

const path = require('path');
const fs = require('fs/promises');
const { runTests } = require('@vscode/test-electron');
const { resolveTraeExecutable } = require('./resolve_trae_executable');

async function main() {
  try {
    const emptyDir1 = path.resolve(__dirname, 'empty1');
    const emptyDir2 = path.resolve(__dirname, 'empty2');
    await fs.mkdir(emptyDir1, { recursive: true });
    await fs.mkdir(emptyDir2, { recursive: true });

    const vscodeExecutablePath = await resolveTraeExecutable();
    console.log(`Using Trae executable: ${vscodeExecutablePath}`);

    const extensionTestsPath = path.resolve(__dirname, 'main_impl.js');

    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath: __dirname,
      extensionTestsPath,
      launchArgs: [
        '--extensions-dir',
        emptyDir1,
        '--user-data-dir',
        emptyDir2,
        '--disable-extensions',
      ],
    });

    await fs.rm(emptyDir1, { recursive: true, force: true });
    await fs.rm(emptyDir2, { recursive: true, force: true });
  } catch (err) {
    console.error('Failed to run:', err.message || err);
    process.exit(1);
  }
}

main();
