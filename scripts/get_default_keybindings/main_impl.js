'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const vscode = require('vscode');

const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

async function openDefaultKeybindingsFile() {
  return new Promise((resolve, reject) => {
    const listener = vscode.window.onDidChangeVisibleTextEditors((textEditors) => {
      for (const textEditor of textEditors) {
        const uri = textEditor.document.uri;
        if (uri.scheme === 'vscode' && path.basename(uri.path) === 'keybindings.json') {
          listener.dispose();
          resolve(textEditor.document);
        }
      }
    });

    vscode.commands.executeCommand('workbench.action.openDefaultKeybindingsFile').then(() => {
      setTimeout(() => {
        listener.dispose();
        reject(new Error('Timeout waiting for keybindings file'));
      }, 120 * 1000);
    }).catch(reject);
  });
}

function makeHeader(platform) {
  const target =
    platform === 'win32' ? 'Windows' :
    platform === 'darwin' ? 'macOS' :
    'Linux';
  const signature = `${vscode.env.appName} ${vscode.version} for ${target}`;
  return `// Default Keybindings of ${signature}\n`;
}

function makeOutputFilePath(platform) {
  const prefix =
    platform === 'win32' ? 'windows' :
    platform === 'darwin' ? 'macos' :
    'linux';
  return path.resolve(__dirname, `../${prefix}.keybindings.raw.json`);
}

async function run() {
  await sleep(5000);
  const document = await openDefaultKeybindingsFile();
  const json = document.getText();
  const platform = os.platform();
  const header = makeHeader(platform);
  const outputPath = makeOutputFilePath(platform);
  await fs.writeFile(outputPath, header + json);
  console.log(`The default keybindings JSON has been successfully saved to ${outputPath}.`);
}

module.exports = {
  run,
};
