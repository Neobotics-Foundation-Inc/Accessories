# Neobotics Accessories

A collection of NeoRacer-themed visuals built by **Neobotics Foundation Inc.** that you can run as a live background or install as a screensaver.

Each folder is a self-contained Electron app sharing the same HUD + interactive car-reveal layout, but with a different procedural background engine:

| Folder | Vibe | Background |
| --- | --- | --- |
| `Lofi Background/` | Calm, ambient, slow-moving | Soft particles + gentle glow |
| `Dynamic Background/` | High-energy, reactive | Procedural PCB / grid motion |

Both include a `background.png` / `background.jpg` in `assets/` if you only want the static image.

---

## Option 1 — Static Wallpaper (easiest, 30 seconds)

No install required. Grab the image and set it as your desktop wallpaper.

1. Open the folder you want (`Lofi Background` or `Dynamic Background`) on GitHub.
2. Go into `assets/` and download **`background.png`** (or `background.jpg`).

### Windows
- Right-click the downloaded image → **Set as desktop background**.
- Or: **Settings → Personalization → Background → Browse photos**.

### macOS
- Right-click the downloaded image in Finder → **Set Desktop Picture**.
- Or: **System Settings → Wallpaper → Add Photo**.

---

## Option 2 — Live Interactive Background (Windows + Mac)

Run the full animated experience with the HUD, reveal cursor, and procedural effects.

### Prerequisites
- [Node.js](https://nodejs.org) 18 or newer (check with `node -v`)
- Git (to clone) — or just download the repo as a ZIP

### Steps (same on Windows & Mac)

```bash
# 1. Clone the repo
git clone https://github.com/Neobotics-Foundation-Inc/accessories.git
cd accessories

# 2. Pick a folder (quote the name — it has a space)
cd "Dynamic Background"       # or "Lofi Background"

# 3. Install dependencies
npm install

# 4a. Quickest: open in your browser
npm start
# → visit http://localhost:3001

# 4b. Or run as a fullscreen Electron app
npm run electron
```

Press any key or move the mouse to exit the Electron window.

---

## Option 3 — Install as a Windows Screensaver (`.scr`)

This is the proper "set it and forget it" route. The Electron app already handles the Windows screensaver flags (`/s`, `/c`, `/p`), so you can compile it to a `.scr` file.

```bash
cd "Dynamic Background"       # or "Lofi Background"
npm install
npm run build
```

Then:

1. Look in the new `dist/` folder for the portable `.exe` (e.g. `NeoRacer Screensaver 1.0.0.exe`).
2. **Rename the `.exe` to `.scr`** — e.g. `NeoRacer.scr`.
3. Move it to `C:\Windows\System32\` (requires admin).
4. Open **Settings → Personalization → Lock screen → Screen saver** and pick **NeoRacer Screensaver** from the dropdown.
5. Click **Preview** to test, set your wait time, and hit **OK**.

> Tip: if you don't want to put it in System32, right-click the `.scr` file anywhere on disk and choose **Install**.

---

## Option 4 — macOS Screensaver Workaround

macOS doesn't support Electron-based `.saver` bundles out of the box. Two options:

**A. Run as an always-available app**
```bash
cd "Dynamic Background"
npm install
npm run electron
```
Add a keyboard shortcut or a macOS Shortcut to launch it on-demand.

**B. Trigger on idle via Shortcuts / Automator**
1. Open **Shortcuts.app** → New Shortcut → **Run Shell Script**.
2. Command: `cd "/path/to/accessories/Dynamic Background" && npm run electron`
3. Bind it to a hotkey or schedule it with a third-party idle-trigger app (e.g. [Hammerspoon](https://www.hammerspoon.org/)).

A native `.saver` package can be added later if there's demand — open an issue.

---

## Project Structure

```
accessories/
├── Lofi Background/
│   ├── assets/          ← images (background, logo, car render, lineart)
│   ├── css/style.css    ← HUD + overlay styles
│   ├── js/screensaver.js← render loop + procedural engine
│   ├── index.html       ← layout
│   ├── main.js          ← Electron entry (handles /s /c /p)
│   ├── server.js        ← dev HTTP server (port 3001)
│   └── package.json
└── Dynamic Background/  ← same structure, different engine
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm: command not found` | Install Node.js from [nodejs.org](https://nodejs.org) |
| `EACCES` on Windows build | Run your terminal as Administrator |
| Electron window is blank | Delete `node_modules` + `package-lock.json`, re-run `npm install` |
| Screensaver won't show in Settings (Windows) | Make sure the file ends in `.scr` and lives in `System32`, or right-click → Install |

---

## License

ISC — see each folder's `package.json`.
Built by **Neobotics Foundation Inc.** · Autonomous Systems · NeoRacer
