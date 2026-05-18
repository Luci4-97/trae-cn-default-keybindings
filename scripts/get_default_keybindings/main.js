'use strict';

const path = require('path');
const fs = require('fs/promises');
const { runTests } = require('@vscode/test-electron');
const { resolveTraeExecutable } = require('./resolve_trae_executable');
const { prepareLaunchProfile } = require('./prepare_launch_profile');

async function main() {
  try {
    const dirs = await prepareLaunchProfile();
    console.log(`CI HOME: ${dirs.ciHome}`);
    console.log(`User data dir: ${dirs.userDataDir}`);
    console.log(`Workspace: ${dirs.workspaceDir}`);

    const vscodeExecutablePath = await resolveTraeExecutable();
    console.log(`Using Trae executable: ${vscodeExecutablePath}`);

    const extensionTestsPath = path.resolve(__dirname, 'main_impl.js');

    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath: __dirname,
      extensionTestsPath,
      launchArgs: [
        dirs.workspaceDir,
        '--extensions-dir',
        dirs.extensionsDir,
        '--user-data-dir',
        dirs.userDataDir,
        '--disable-extensions',
      ],
    });

    const cleanupRoots = [dirs.extensionsDir, dirs.userDataDir, dirs.workspaceDir, dirs.ciHome];
    await Promise.all(
      cleanupRoots.map((dir) => fs.rm(dir, { recursive: true, force: true }))
    );
  } catch (err) {
    console.error('Failed to run:', err.message || err);
    process.exit(1);
  }
}

main();
