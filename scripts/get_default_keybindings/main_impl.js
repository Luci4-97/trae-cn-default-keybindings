const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const vscode = require('vscode');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function openDefaultKeybindingsFile() {
  return new Promise((resolve, reject) => {
    const listener = vscode.window.onDidChangeVisibleTextEditors((textEditors) => {
      for (const textEditor of textEditors) {
        const uri = textEditor.document.uri;
        if (uri.scheme === 'vscode' && path.basename(uri.path) === 'keybindings.json') {
          listener.dispose();
          resolve(textEditor.document);
          return;
        }
      }
    });

    vscode.commands.executeCommand('workbench.action.openDefaultKeybindingsFile').then(() => {
      setTimeout(() => {
        listener.dispose();
        reject(new Error('Timeout waiting for keybindings file'));
      }, 15000);
    }).catch(reject);
  });
}

function makeHeader(platform) {
  const target = (platform === 'win32') ? 'Windows' : 
                 (platform === 'darwin') ? 'macOS' : 'Linux';
  const signature = `// Default Keybindings of Trae CN for ${target}\n`;
  return signature;
}

function makeOutputFilePath(platform) {
  const prefix = (platform === 'win32') ? 'windows' : 
                 (platform === 'darwin') ? 'macos' : 'linux';
  const outputPath = path.join(__dirname, '..', `${prefix}.keybindings.raw.json`);
  return outputPath;
}

async function run() {
  await sleep(3000);
  
  const document = await openDefaultKeybindingsFile();
  const json = document.getText();
  const platform = os.platform();
  const header = makeHeader(platform);
  const outputPath = makeOutputFilePath(platform);
  
  await fs.writeFile(outputPath, header + json);
  console.log(`Default keybindings JSON has been successfully saved to ${outputPath}`);
  
  setTimeout(() => {
    vscode.commands.executeCommand('workbench.action.quit');
  }, 1000);
}

module.exports = {
  run
};

if (require.main === module) {
  run();
}
