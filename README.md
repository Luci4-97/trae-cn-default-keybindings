# Trae CN Default Keybindings

This repository maintains up-to-date default keyboard shortcuts for Trae CN IDE across different operating systems. Trae CN is a VS Code-based AI coding IDE developed by ByteDance.

## Why

Trae CN uses different key combinations for different platforms. "Find" might be bound to different keys on Windows vs macOS. This can be annoying if you use Trae CN on multiple operating systems.

This repo provides default keybindings that can be used to:
- Apply keybindings from another OS
- Remove Trae CN's default keys entirely
- Maintain consistent keyboard shortcuts across platforms

## How to Use

1. Open Trae CN
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. Search for "Preferences: Open Keyboard Shortcuts (JSON)"
4. Paste the contents of the keybindings file you want to apply

### Example

If you're on macOS but want Windows keybindings:
1. Paste `macos.negative.keybindings.json` to remove macOS defaults
2. Paste `windows.keybindings.json` to add Windows defaults

## Files

| File | Description |
|------|-------------|
| `windows.keybindings.json` | Default Windows keybindings |
| `windows.negative.keybindings.json` | Remove Windows keybindings |
| `macos.keybindings.json` | Default macOS keybindings |
| `macos.negative.keybindings.json` | Remove macOS keybindings |
| `linux.keybindings.json` | Default Linux keybindings |
| `linux.negative.keybindings.json` | Remove Linux keybindings |

## Automation

This repository uses GitHub Actions to automatically:
1. Download and install the latest Trae CN
2. Extract default keybindings
3. Process and format the keybindings JSON
4. Create pull requests with updates

## Contributing

Contributions are welcome! Please see the scripts directory for the extraction and processing logic.

## License

MIT License
