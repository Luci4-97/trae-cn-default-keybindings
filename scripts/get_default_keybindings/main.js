const fs = require('fs-extra');
const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
  try {
    const emptyDir1 = path.resolve(__dirname, 'empty1');
    const emptyDir2 = path.resolve(__dirname, 'empty2');
    
    await fs.mkdirs(emptyDir1);
    await fs.mkdirs(emptyDir2);

    let traeExecutablePath;
    const platform = process.platform;

    if (platform === 'win32') {
      traeExecutablePath = path.join(
        process.env.USERPROFILE || process.env.HOMEPATH,
        'AppData',
        'Local',
        'Programs',
        'Trae CN',
        'traecli.exe'
      );
    } else if (platform === 'darwin') {
      traeExecutablePath = '/Applications/Trae CN.app/Contents/MacOS/Trae CN';
    } else {
      traeExecutablePath = '/usr/bin/traecli';
    }

    console.log(`Detected platform: ${platform}`);
    console.log(`Looking for Trae CN at: ${traeExecutablePath}`);

    if (!await fs.pathExists(traeExecutablePath)) {
      console.log(`Trae CN not found at default location. Trying 'traecli' command...`);
      const { spawnSync } = require('child_process');
      const result = spawnSync('which', ['traecli']);
      if (result.stdout && result.stdout.toString().trim()) {
        traeExecutablePath = result.stdout.toString().trim();
        console.log(`Found traecli at: ${traeExecutablePath}`);
      } else {
        console.error('ERROR: Trae CN executable not found!');
        console.error('Please install Trae CN first.');
        process.exit(1);
      }
    }

    const extensionTestsPath = path.resolve(__dirname, 'main_impl.js');

    console.log('Starting Trae CN to extract keybindings...');
    await runTests({
      vscodeExecutablePath: traeExecutablePath,
      extensionDevelopmentPath: __dirname,
      extensionTestsPath: extensionTestsPath,
      launchArgs: [
        '--extensions-dir', emptyDir1,
        '--user-data-dir', emptyDir2,
        '--disable-extensions'
      ]
    });

    console.log('Keybindings extraction completed successfully!');
    
    await fs.remove(emptyDir1);
    await fs.remove(emptyDir2);

  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
