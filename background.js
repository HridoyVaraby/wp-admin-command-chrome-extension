// WP Admin Command - Background Script

// Storage key for extension settings
const taStorageKey = 'wp-admin-command-settings';

// Default settings for the extension
const defaultSettings = {
  shortcutKeys: [
    {
      meta: false,
      alt: false,
      ctrl: true,
      shift: true,
      key: 'z'
    }
  ],
  'block-editor-fullscreen-disable': true,
  'block-editor-welcome-screen-kill': true,
  'live-dev-notice': false,
  'list-table-keyboard-shortcuts': true,
  'hide-notices': true,
  'rememberedNoticeIds': [],
  'barkeeper': true,
  'admin-bar-search': true,
  'debug-mode': false
};

// Initialize extension settings
async function initSettings() {
  const data = await chrome.storage.local.get(taStorageKey);
  
  // If no settings exist, set defaults
  if (!data[taStorageKey]) {
    const settings = {};
    settings[taStorageKey] = defaultSettings;
    await chrome.storage.local.set(settings);
    console.log('Turbo Admin: Default settings initialized');
  }
}

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Turbo Admin: Extension installed');
    await initSettings();
  } else if (details.reason === 'update') {
    console.log('Turbo Admin: Extension updated');
    // Could handle migration of settings here if needed
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.local.get(taStorageKey, (data) => {
      sendResponse({ settings: data });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'saveSettings') {
    chrome.storage.local.set({ [taStorageKey]: message.settings }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
});

// Handle browser action click (toolbar icon)
chrome.action.onClicked.addListener((tab) => {
  // Only inject if we're on a WordPress admin page
  if (tab.url.includes('wp-admin') || tab.url.includes('wp-login.php')) {
    // Add error handling for the sendMessage call
    chrome.tabs.sendMessage(tab.id, { action: 'togglePalette' })
      .catch(error => {
        console.log('WP Admin Command: Error sending message to tab', error);
        // The content script might not be loaded yet, or the tab might not exist
        // We could reload the tab or show a notification to the user
      });
  } else {
    // If not on a WordPress admin page, show a notification or open options
    chrome.tabs.sendMessage(tab.id, { action: 'notWordPress' })
      .catch(error => {
        console.log('WP Admin Command: Error sending message to tab', error);
        // Handle the error appropriately
      });
  }
});