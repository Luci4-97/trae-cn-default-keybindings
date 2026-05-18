'use strict';

const fs = require('fs/promises');
const path = require('path');

/** Short paths avoid macOS Unix socket path limits (~103 chars) on GitHub Actions. */
function getCiHome() {
  if (process.platform === 'win32') {
    return path.join(process.env.RUNNER_TEMP || process.env.TEMP || 'C:\\tmp', 'trae-ci-home');
  }
  return '/tmp/trae-ci-home';
}

function getLaunchDirs() {
  const base =
    process.platform === 'win32'
      ? path.join(process.env.RUNNER_TEMP || process.env.TEMP || 'C:\\tmp', 'trae-kb')
      : '/tmp/trae-kb';

  return {
    ciHome: getCiHome(),
    extensionsDir: path.join(base, 'ext'),
    userDataDir: path.join(base, 'data'),
    workspaceDir: path.join(base, 'ws'),
  };
}

async function writeStorageJson(globalStorageDir) {
  await fs.mkdir(globalStorageDir, { recursive: true });
  const storage = {
    'workbench.welcomePage.hidden': true,
    'icube.setup.completed': true,
    'icube.setup.state': 'COMPLETE',
    'trae.setup.completed': true,
    'native_ide_installed': true,
  };
  await fs.writeFile(
    path.join(globalStorageDir, 'storage.json'),
    `${JSON.stringify(storage, null, 2)}\n`
  );
}

async function seedUserData(userDataDir) {
  const userDir = path.join(userDataDir, 'User');
  await writeStorageJson(path.join(userDir, 'globalStorage'));
  await fs.writeFile(
    path.join(userDir, 'settings.json'),
    `${JSON.stringify(
      {
        'workbench.startupEditor': 'none',
      },
      null,
      2
    )}\n`
  );
}

/** Trae also reads modular state from ~/.trae (under HOME). */
async function seedTraeHome(ciHome) {
  await writeStorageJson(path.join(ciHome, '.trae', 'User', 'globalStorage'));
}

async function prepareLaunchProfile() {
  const dirs = getLaunchDirs();

  process.env.HOME = dirs.ciHome;
  if (process.platform === 'win32') {
    process.env.USERPROFILE = dirs.ciHome;
  }

  await fs.mkdir(dirs.ciHome, { recursive: true });
  await fs.mkdir(dirs.extensionsDir, { recursive: true });
  await fs.mkdir(dirs.userDataDir, { recursive: true });
  await fs.mkdir(dirs.workspaceDir, { recursive: true });

  await seedUserData(dirs.userDataDir);
  await seedTraeHome(dirs.ciHome);

  return dirs;
}

module.exports = {
  prepareLaunchProfile,
  getLaunchDirs,
};
