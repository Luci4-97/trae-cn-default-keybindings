'use strict';

const { spawn } = require('child_process');
const { execFileSync } = require('child_process');
const { prepareLaunchProfile, markProfileReady } = require('./prepare_launch_profile');
const { resolveTraeExecutable } = require('./resolve_trae_executable');

const CLICK_SCRIPT = `
tell application "System Events"
  repeat with appName in {"Trae", "Electron"}
    try
      tell process appName
        set frontmost to true
        repeat with btnName in {"Get Started", "Continue", "Skip", "Next", "Done", "Confirm", "Not Now", "Later", "开始使用", "继续", "跳过", "下一步", "完成"}
          try
            click button btnName of window 1
            delay 0.5
          end try
          try
            click button btnName of sheet 1 of window 1
            delay 0.5
          end try
        end repeat
      end tell
    end try
  end repeat
end tell
`;

function buildLaunchArgs(dirs) {
  return [
    dirs.workspaceDir,
    '--extensions-dir',
    dirs.extensionsDir,
    '--user-data-dir',
    dirs.userDataDir,
    '--disable-extensions',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
  ];
}

function clickSetupButtons() {
  try {
    execFileSync('osascript', ['-e', CLICK_SCRIPT], { stdio: 'pipe' });
  } catch (err) {
    console.warn(`osascript click attempt: ${err.message}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (process.platform !== 'darwin') {
    console.log('bootstrap_setup_macos: skipped (not macOS)');
    return;
  }

  const dirs = await prepareLaunchProfile();
  const executable = await resolveTraeExecutable();
  const args = buildLaunchArgs(dirs);

  console.log('Bootstrapping Trae first-run setup...');
  console.log(`Executable: ${executable}`);

  const child = spawn(executable, args, {
    env: process.env,
    stdio: 'inherit',
  });

  await sleep(8000);

  const rounds = 12;
  for (let i = 0; i < rounds; i += 1) {
    console.log(`Automating setup UI (${i + 1}/${rounds})...`);
    clickSetupButtons();
    await sleep(4000);
  }

  console.log('Stopping bootstrap Trae process...');
  child.kill('SIGTERM');

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 15000);
    child.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  await markProfileReady(dirs.userDataDir);
  console.log('Trae setup bootstrap finished.');
}

main().catch((err) => {
  console.error('bootstrap_setup_macos failed:', err.message || err);
  process.exit(1);
});
