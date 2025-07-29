# Smart TabGuard Extension

## Overview
Smart TabGuard is a Chrome extension designed to help users avoid losing important work by warning them before closing tabs with unsaved changes (e.g., forms, text inputs). It also allows users to always protect specific sites and provides a visual warning icon to indicate active protection.

---

## Features
- **Detects Unsaved Work:** Monitors forms and input fields for unsaved changes.
- **Warns Before Closing:** Pops up a warning if you try to close a tab with unsaved work.
- **Always Protect This Site:** Option to always protect specific sites (stored in Chrome storage).
- **Dynamic Icon:** The extension icon changes to a warning state when unsaved changes are detected on a protected site.

---

## Tech Stack
- **Manifest V3**
- **JavaScript**
- **Chrome APIs:** `chrome.tabs`, `chrome.storage`, `chrome.runtime`
- **HTML/CSS** for popup and options UI

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/)

### Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/Goldokpa/tabguard-extension.git
   cd tabguard-extension
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Build the extension:**
   ```sh
   npx tsc
   ```
   This will compile TypeScript files into the `dist/` directory.

---

## Loading the Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/` directory.
4. The Smart TabGuard icon should appear in your browser toolbar.

---

## Usage
- The extension will automatically monitor tabs for unsaved work.
- If you try to close a tab with unsaved changes, a warning will appear.
- Use the popup to enable "Always protect this site" for specific domains.
- The icon changes to a warning state when protection is active and unsaved changes are detected.

---

## Development
- Source TypeScript files are in the root and `popup/` directories.
- Styles are in `popup/popup.css` and `options.css`.
- Update `manifest.json` for permissions or new features.
- Run `npx tsc --watch` during development for automatic compilation.

---

## Contributing
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

---

## License
MIT License. See [LICENSE](../LICENSE) for details.

---

## Credits
Created by Gold Okpa. 
