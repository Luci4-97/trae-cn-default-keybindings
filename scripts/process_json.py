#!/usr/bin/env python3

import re
import os

def makeCommandsNegatives(s):
    sNegative = re.sub(r'"command": "([^"]+)"', r'"command": "-\\1"', s)
    if s == sNegative:
        print('Warning: no commands found to make negative')
    return sNegative

def fixLineEndings(filename, osname):
    with open(filename, 'rb') as fIn:
        b = fIn.read()

    if osname == 'windows':
        b = b.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
    else:
        b = b.replace(b'\r\n', b'\n')

    if osname == 'macos':
        b = b.replace(b'\n        [', b'\n    [')
        b = b.replace(b'\n[', b'\n[\n    ')
    elif osname == 'windows':
        b = b.replace(b'\r\n        [', b'\r\n    [')
        b = b.replace(b'\r\n[', b'\r\n[\r\n    ')
    elif osname == 'linux':
        b = b.replace(b'\n        [', b'\n  [')
        b = b.replace(b'\n[', b'\n[\n  ')

    b = b.replace(b'// Override key bindings by placing them into your key bindings file.', b'')
    
    b = b.split(b'// Here are other available commands:')[0]

    with open(filename, 'wb') as fOut:
        fOut.write(b)

def processRawFile(inputFile):
    if not os.path.isfile(inputFile):
        print('Not found: ' + inputFile)
        return

    osname = inputFile.split('.')[0]
    if osname not in ['linux', 'windows', 'macos']:
        print('Expected the filename to start with linux, windows, or macos')
        return

    with open(inputFile, 'r', encoding='utf-8') as fIn:
        s = fIn.read()

    s = s.strip()

    outputFile = '../' + osname + '.keybindings.json'
    with open(outputFile, 'w', encoding='utf-8') as fOut:
        fOut.write(s)

    outputNegativeFile = '../' + osname + '.negative.keybindings.json'
    with open(outputNegativeFile, 'w', encoding='utf-8') as fOut:
        fOut.write(makeCommandsNegatives(s))

    fixLineEndings(outputFile, osname)
    fixLineEndings(outputNegativeFile, osname)

    print('Wrote to ' + outputFile)
    print('Wrote to ' + outputNegativeFile)

if __name__ == '__main__':
    print('Processing json')
    if os.path.exists('linux.keybindings.raw.json'):
        processRawFile('linux.keybindings.raw.json')
    if os.path.exists('windows.keybindings.raw.json'):
        processRawFile('windows.keybindings.raw.json')
    if os.path.exists('macos.keybindings.raw.json'):
        processRawFile('macos.keybindings.raw.json')
    print('Done')
