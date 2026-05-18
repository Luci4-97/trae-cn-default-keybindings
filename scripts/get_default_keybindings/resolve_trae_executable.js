'use strict';

const fs = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');

const APP_NAMES = ['Trae', 'Trae CN'];

/** Electron-based VS Code forks use this binary name inside .app bundles on macOS. */
const MACOS_BINARY_NAMES = ['Electron', 'Trae'];

const LINUX_BINARY_NAMES = ['trae', 'Trae', 'electron', 'Electron'];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findMacOSExecutable() {
  for (const appName of APP_NAMES) {
    const macosDir = `/Applications/${appName}.app/Contents/MacOS`;
    if (!(await pathExists(macosDir))) {
      continue;
    }

    for (const binaryName of MACOS_BINARY_NAMES) {
      const candidate = path.join(macosDir, binaryName);
      if (await pathExists(candidate)) {
        return candidate;
      }
    }

    const entries = await fs.readdir(macosDir);
    for (const entry of entries) {
      const candidate = path.join(macosDir, entry);
      const stat = await fs.stat(candidate);
      if (stat.isFile() && (stat.mode & 0o111)) {
        return candidate;
      }
    }
  }
  return undefined;
}

async function findWindowsExecutable() {
  const baseDir = process.env.USERPROFILE || process.env.HOMEPATH;
  if (!baseDir) {
    return undefined;
  }

  for (const appName of APP_NAMES) {
    const candidate = path.join(
      baseDir,
      'AppData',
      'Local',
      'Programs',
      appName,
      'traecli.exe'
    );
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

async function findLinuxExecutable() {
  for (const appName of APP_NAMES) {
    const slug = appName.toLowerCase().replace(/\s+/g, '');
    const candidates = [
      `/usr/bin/${slug}`,
      `/usr/local/bin/${slug}`,
      `/opt/${appName}/${slug}`,
      `/opt/${appName}/bin/${slug}`,
    ];
    for (const candidate of candidates) {
      if (await pathExists(candidate)) {
        return candidate;
      }
    }
  }

  for (const command of ['traecli', 'trae']) {
    const result = spawnSync('which', [command], { encoding: 'utf8' });
    const found = result.stdout?.trim();
    if (found && await pathExists(found)) {
      return found;
    }
  }

  return undefined;
}

function formatCheckedLocations(platform) {
  if (platform === 'darwin') {
    return APP_NAMES.flatMap((appName) =>
      MACOS_BINARY_NAMES.map(
        (binary) => `/Applications/${appName}.app/Contents/MacOS/${binary}`
      )
    );
  }
  if (platform === 'win32') {
    const baseDir = process.env.USERPROFILE || '%USERPROFILE%';
    return APP_NAMES.map(
      (appName) =>
        `${baseDir}\\AppData\\Local\\Programs\\${appName}\\traecli.exe`
    );
  }
  return ['/usr/bin/trae', 'traecli (in PATH)', 'trae (in PATH)'];
}

/**
 * Resolve the Trae CLI/Electron executable.
 * Honors TRAE_EXECUTABLE_PATH when set (e.g. by GitHub Actions after install).
 */
async function resolveTraeExecutable() {
  const envPath = process.env.TRAE_EXECUTABLE_PATH?.trim();
  if (envPath) {
    if (!(await pathExists(envPath))) {
      throw new Error(`TRAE_EXECUTABLE_PATH does not exist: ${envPath}`);
    }
    return envPath;
  }

  const platform = process.platform;
  let executablePath;

  if (platform === 'darwin') {
    executablePath = await findMacOSExecutable();
  } else if (platform === 'win32') {
    executablePath = await findWindowsExecutable();
  } else {
    executablePath = await findLinuxExecutable();
  }

  if (!executablePath) {
    const locations = formatCheckedLocations(platform);
    throw new Error(
      'Trae executable not found. Install Trae or set TRAE_EXECUTABLE_PATH.\n' +
      'Checked:\n' +
      locations.map((loc) => `  - ${loc}`).join('\n')
    );
  }

  return executablePath;
}

module.exports = { resolveTraeExecutable };
