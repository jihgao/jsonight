# JSONight

A lightweight JSON editor with Python dict support, built with Tauri v2. Features a split-pane editor with live tree preview, format/minify tools, and a Catppuccin-inspired theme system.

## Features

- **Split-pane editor** with line numbers and live JSON tree preview
- **Python dict parsing** — paste Python dicts with single quotes, trailing commas, `True`/`False`/`None` and get instant JSON output
- **Format & Minify** — beautify or compact your JSON in one click
- **Collapsible tree view** — expand/collapse nested objects and arrays
- **Three view modes**: Editor & Preview, Editor Only, Preview Only
- **Three themes**: Dark (Catppuccin Mocha), Light (Catppuccin Latte), System
- **Native menu bar**: File / Edit / Tools / View with keyboard shortcuts
- **File operations**: New, Open, Save, Save As via native dialogs
- **Status bar**: filename with dirty indicator, cursor position, byte count
- **Unsaved changes warning** on close
- **Copy to clipboard** button

## Quick Start

### Prerequisites

| Platform | Requirements |
|---|---|
| **All** | Rust toolchain (`rustup`), Node.js 18+ |
| **Linux** | `libwebkit2gtk-4.1-dev`, `build-essential`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` |
| **macOS** | Xcode Command Line Tools |
| **Windows** | Microsoft C++ Build Tools, WebView2 |

### Run (dev mode)

```bash
cargo tauri dev
```

### Build (release)

```bash
cargo tauri build
```

Outputs:
- **Linux**: `.deb` + `.AppImage` in `src-tauri/target/release/bundle/`
- **macOS**: `.dmg` in `src-tauri/target/release/bundle/`
- **Windows**: `.exe` installer in `src-tauri/target/release/bundle/`

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| New | Cmd/Ctrl+N |
| Open | Cmd/Ctrl+O |
| Save | Cmd/Ctrl+S |
| Save As | Cmd/Ctrl+Shift+S |
| Format JSON | Cmd/Ctrl+Shift+F |
| Minify JSON | Cmd/Ctrl+Shift+M |
| Parse Python Dict | Cmd/Ctrl+Shift+P |
| Toggle Preview | Cmd/Ctrl+P |
| Toggle Line Numbers | Cmd/Ctrl+L |

## CI/CD

| Workflow | Trigger | Output |
|---|---|---|
| `ci.yml` | PRs to `master` | Builds on Linux/macOS/Windows, 14-day artifacts |
| `release.yml` | Git tag `v*` | Builds all platforms, draft GitHub Release |

## License

MIT
