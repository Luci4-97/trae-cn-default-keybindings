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

    // Possible app names (in order of priority)
    const appNames = ['Trae', 'Trae CN'];

    if (platform === 'win32') {
      // Windows: Check both possible install paths
      const programFilesPath = process.env.USERPROFILE || process.env.HOMEPATH;
      for (const appName of appNames) {
        const candidatePath = path.join(
          programFilesPath,
          'AppData',
          'Local',
          'Programs',
          appName,
          'traecli.exe'
        );
        if (await fs.pathExists(candidatePath)) {
          traeExecutablePath = candidatePath;
          break;
        }
      }
    } else if (platform === 'darwin') {
      // macOS: Check both possible app names
      for (const appName of appNames) {
        const candidatePath = `/Applications/${appName}.app/Contents/MacOS/${appName.split(' ')[0]}`;
        if (await fs.pathExists(candidatePath)) {
          traeExecutablePath = candidatePath;
          break;
        }
      }
    } else {
      // Linux
      for (const appName of appNames) {
        const candidatePath = `/usr/bin/${appName.toLowerCase().replace(' ', '')}`;
        if (await fs.pathExists(candidatePath)) {
          traeExecutablePath = candidatePath;
          break;
        }
      }
    }

    console.log(`Detected platform: ${platform}`);

    // If not found in default paths, try 'traecli' command
    if (!traeExecutablePath) {
      console.log('Trae not found at default locations. Trying system commands...');
      const { spawnSync } = require('child_process');
      
      // Try 'traecli'
      const traecliResult = spawnSync('which', ['traecli']);
      if (traecliResult.stdout && traecliResult.stdout.toString().trim()) {
        traeExecutablePath = traecliResult.stdout.toString().trim();
        console.log(`Found traecli at: ${traeExecutablePath}`);
      } else {
        // Try 'trae'
        const traeResult = spawnSync('which', ['trae']);
        if (traeResult.stdout && traeResult.stdout.toString().trim()) {
          traeExecutablePath = traeResult.stdout.toString().trim();
          console.log(`Found trae at: ${traeExecutablePath}`);
        }
      }
    }

    // If still not found, show error with suggestions
    if (!traeExecutablePath) {
      console.error('ERROR: Trae executable not found!');
      console.error('');
      console.error('Possible locations checked:');
      if (platform === 'darwin') {
        console.error('  - /Applications/Trae.app/Contents/MacOS/Trae');
        console.error('  - /Applications/Trae CN.app/Contents/MacOS/Trae');
        console.error('  - traecli (in PATH)');
        console.error('  - trae (in PATH)');
      } else if (platform === 'win32') {
        console.error('  - %USERPROFILE%/AppData/Local/Programs/Trae/traecli.exe');
        console.error('  - %USERPROFILE%/AppData/Local/Programs/Trae CN/traecli.exe');
      }
      console.error('');
      console.error('Please install Trae first and ensure it is in your PATH.');
      process.exit(1);
    }

    console.log(`Using Trae executable: ${traeExecutablePath}`);

    const extensionTestsPath = path.resolve(__dirname, 'main_impl.js');

    console.log('Starting Trae to extract keybindings...');
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
