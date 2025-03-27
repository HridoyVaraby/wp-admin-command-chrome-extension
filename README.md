# WP Admin Command

A Chrome extension that provides a command palette for super fast access to your WordPress Dashboard.

![WP Admin Command](icons/icon128.png)

## Features

- **Command Palette**: Press Ctrl+Shift+Z to open a command palette for quick access to WordPress admin functions
- **Smart Search**: Quickly find and navigate to posts, pages, settings, and more
- **UI Enhancements**: 
  - Disable block editor fullscreen mode
  - Remove block editor welcome screen
  - Hide WordPress admin notices
  - Add keyboard shortcuts to list tables
  - Add search functionality to the admin bar

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension is now installed and ready to use

## Usage

1. Navigate to any WordPress admin page
2. Press Ctrl+Shift+Z (default shortcut) or click the extension icon in your browser toolbar
3. Start typing to search for commands, content, or settings
4. Use arrow keys to navigate results and Enter to select

## Configuration

The extension comes with sensible defaults, but you can customize various settings anytime:

- Keyboard shortcuts
- UI enhancements
- Debug mode. No need to code. 

## Development

### Project Structure
- `manifest.json`: Extension configuration
- `background.js`: Background service worker
- `content.js`: Content script injected into WordPress admin pages
- `turbo-admin.css`: Styles for the command palette and UI enhancements
- `icons/`: Extension icons

## Credits

Developed by [Hridoy Varaby](https://github.com/hridoyvaraby) at [Varabit Web Design & Development](https://varabit.com)

## License

This project is licensed under the MIT License - see the LICENSE file for details.