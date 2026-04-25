# Mkraftman Windows PC Keyboard

A custom Lovelace keyboard input card for Home Assistant providing always-active keyboard input for a Windows PC via Unified Remote. Designed for use on iPad and mobile kiosk dashboards.

![HACS Badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)

## Features

- **Minimalist design** — single centred keyboard icon that opens the native soft keyboard on tap.
- **Direct keystroke forwarding** — each character typed is sent immediately to the Windows PC via Unified Remote's `Relmtech.Keyboard` remote. No local text display or input buffer.
- **Reliable iOS/iPadOS backspace** — uses a zero-width space sentinel character to ensure backspace events are always captured, even on iOS soft keyboards where `keydown` events don't fire on an empty input.
- **Special key support** — Enter, Escape, Tab, and arrow keys are intercepted and forwarded.
- **No scroll drift** — prevents the dashboard from scrolling when the soft keyboard opens or closes.

## Requirements

- [hass-unified-remote](https://github.com/akshansh1998/hass-unified-remote) custom integration
- Unified Remote Server running on the target Windows PC with remote access enabled

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend** → three-dot menu → **Custom repositories**
3. Add `https://github.com/mkraftman/mkraftman-windows-pc-keyboard` as a **Dashboard** repository
4. Search for "Mkraftman Windows PC Keyboard" and install it
5. Add the resource in **Settings → Dashboards → Resources** (HACS may do this automatically)

### Manual

1. Download `mkraftman-windows-pc-keyboard.js` from the [latest release](https://github.com/mkraftman/mkraftman-windows-pc-keyboard/releases)
2. Place it in your `www/` folder
3. Add the resource in **Settings → Dashboards → Resources**:
   - URL: `/local/mkraftman-windows-pc-keyboard.js`
   - Type: JavaScript Module

## Usage

```yaml
type: custom:mkraftman-windows-pc-keyboard
```

No configuration options are required. The card uses `unified_remote.call` with `Relmtech.Keyboard` `toggle` to send keystroke events.

## How It Works

The card uses a hidden HTML input element to capture keystrokes from the device's native soft keyboard. A zero-width space sentinel character (`\u200B`) is always present in the input to ensure iOS/iPadOS fires backspace events reliably.

| Input | Key Sent | Method |
|-------|----------|--------|
| Character typed | The character (e.g. `a`, `1`, `@`) | `beforeinput` / `input` event |
| Space | `space` | `beforeinput` / `input` event |
| Backspace | `back` | `keydown` event + sentinel detection |
| Enter | `return` | `keydown` event |
| Escape | `escape` | `keydown` event |
| Tab | `tab` | `keydown` event |
| Arrow keys | `left`, `right`, `up`, `down` | `keydown` event |

## Changelog

### v1.0.3

- Sentinel character approach for reliable iOS/iPadOS backspace
- Remove text display and clear button — keyboard icon only
- Add arrow key forwarding
- Prevent input buffer accumulation

### v1.0.2

- Simplify to centred keyboard icon only, remove text display

### v1.0.1

- Fix: use `toggle` action instead of `stroke` for Unified Remote keyboard commands

### v1.0.0

- Initial release

## License

MIT
