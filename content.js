// WP Admin Command - Content Script

// Storage key for extension settings
const taStorageKey = 'wp-admin-command-settings';

// Global variables
let settings = null;
let paletteContainer = null;
let paletteVisible = false;
let paletteItems = [];
let selectedItemIndex = 0;
let searchInput = null;
let searchMode = null;

// Debug logging function
function turboAdminLog(...args) {
  if (settings && settings['debug-mode']) {
    console.log('[Turbo Admin]', ...args);
  }
}

// Function to indicate this is the extension version
window.turboAdminIsExtension = function() {
  return true;
};

// Initialize the extension
async function init() {
  // Check if we're on a WordPress admin page
  if (!isWordPressAdminPage()) {
    turboAdminLog('Not a WordPress admin page');
    return;
  }

  turboAdminLog('Initializing Turbo Admin extension');
  
  // Get settings from background script
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
      settings = response.settings[taStorageKey];
      turboAdminLog('Settings loaded', settings);
      
      // Create command palette UI
      createCommandPalette();
      
      // Set up keyboard shortcuts
      setupKeyboardShortcuts();
      
      // Apply other UI enhancements based on settings
      applyUIEnhancements();
    }
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ping') {
      // Respond immediately to ping messages to confirm content script is loaded
      sendResponse({ success: true });
    } else if (message.action === 'togglePalette') {
      togglePalette();
      // Make sure to send response synchronously to avoid message channel closing
      sendResponse({ success: true });
    } else if (message.action === 'notWordPress') {
      alert('Turbo Admin only works on WordPress admin pages.');
      sendResponse({ success: true });
    }
    return true;
  });
}

// Check if current page is a WordPress admin page
function isWordPressAdminPage() {
  return window.location.href.includes('wp-admin') || 
         window.location.href.includes('wp-login.php');
}

// Create the command palette UI
function createCommandPalette() {
  // Create container
  paletteContainer = document.createElement('div');
  paletteContainer.id = 'ta-command-palette-container';
  
  // Create inner palette
  const palette = document.createElement('div');
  palette.id = 'ta-command-palette';
  
  // Create search input
  const searchContainer = document.createElement('div');
  searchContainer.id = 'ta-command-palette-search';
  
  searchInput = document.createElement('input');
  searchInput.id = 'ta-command-palette-input';
  searchInput.type = 'text';
  searchInput.placeholder = 'Search for commands, content, settings...';
  searchInput.autocomplete = 'off';
  
  searchContainer.appendChild(searchInput);
  
  // Create items container
  const itemsContainer = document.createElement('div');
  itemsContainer.id = 'ta-command-palette-items-container';
  
  const itemsList = document.createElement('ul');
  itemsList.id = 'ta-command-palette-items';
  
  itemsContainer.appendChild(itemsList);
  
  // Create search mode tag
  const searchModeTag = document.createElement('div');
  searchModeTag.id = 'ta-command-palette-search-mode-tag';
  searchModeTag.style.display = 'none';
  
  // Create tab notice
  const tabNotice = document.createElement('div');
  tabNotice.id = 'ta-command-palette-tab-notice';
  tabNotice.innerHTML = '<span id="ta-command-palette-tab-notice-text">Press Tab to search content</span><span id="ta-command-palette-tab-notice-button">Tab</span>';
  
  // Create notice element
  const noticeElement = document.createElement('div');
  noticeElement.id = 'ta-command-palette-notice';
  noticeElement.style.display = 'none';
  
  // Assemble palette
  palette.appendChild(searchContainer);
  palette.appendChild(searchModeTag);
  palette.appendChild(tabNotice);
  palette.appendChild(noticeElement);
  palette.appendChild(itemsContainer);
  
  paletteContainer.appendChild(palette);
  
  // Add to document
  document.body.appendChild(paletteContainer);
  
  // Add event listeners
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('keydown', handleKeyDown);
  paletteContainer.addEventListener('click', handleContainerClick);
  
  // Populate initial items
  populateMenuItems();
}

// Set up keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Check if the shortcut matches our settings
    if (settings && settings.shortcutKeys && settings.shortcutKeys.length > 0) {
      const shortcut = settings.shortcutKeys[0];
      
      const metaMatches = shortcut.meta === e.metaKey;
      const altMatches = shortcut.alt === e.altKey;
      const ctrlMatches = shortcut.ctrl === e.ctrlKey;
      const shiftMatches = shortcut.shift === e.shiftKey;
      const keyMatches = shortcut.key.toLowerCase() === e.key.toLowerCase();
      
      if (metaMatches && altMatches && ctrlMatches && shiftMatches && keyMatches) {
        e.preventDefault();
        togglePalette();
      }
    }
  });
}

// Toggle palette visibility
function togglePalette() {
  if (paletteVisible) {
    hideCommandPalette();
  } else {
    showCommandPalette();
  }
}

// Show command palette
function showCommandPalette() {
  paletteContainer.classList.add('active');
  searchInput.focus();
  paletteVisible = true;
}

// Hide command palette
function hideCommandPalette() {
  paletteContainer.classList.remove('active');
  searchInput.value = '';
  paletteVisible = false;
  searchMode = null;
  document.getElementById('ta-command-palette-search-mode-tag').style.display = 'none';
  document.getElementById('ta-command-palette-tab-notice').classList.remove('active');
}

// Handle search input
function handleSearchInput(e) {
  const searchTerm = e.target.value.trim();
  
  // Check for search mode triggers
  if (searchTerm.startsWith('@') && !searchMode) {
    // Content search mode
    searchMode = 'content';
    document.getElementById('ta-command-palette-search-mode-tag').textContent = 'Content Search';
    document.getElementById('ta-command-palette-search-mode-tag').style.display = 'block';
  } else if (searchTerm.startsWith('/') && !searchMode) {
    // Command search mode
    searchMode = 'command';
    document.getElementById('ta-command-palette-search-mode-tag').textContent = 'Command Mode';
    document.getElementById('ta-command-palette-search-mode-tag').style.display = 'block';
  } else if (searchTerm === '' && searchMode) {
    // Reset search mode
    searchMode = null;
    document.getElementById('ta-command-palette-search-mode-tag').style.display = 'none';
  }
  
  // Filter items based on search term
  filterItems(searchTerm);
}

// Handle key down events
function handleKeyDown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectNextItem();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectPreviousItem();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    activateSelectedItem();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    hideCommandPalette();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    if (!searchMode) {
      // Enter content search mode
      searchMode = 'content';
      searchInput.value = '@' + searchInput.value;
      document.getElementById('ta-command-palette-search-mode-tag').textContent = 'Content Search';
      document.getElementById('ta-command-palette-search-mode-tag').style.display = 'block';
      filterItems(searchInput.value);
    }
  }
}

// Handle container clicks
function handleContainerClick(e) {
  // Close palette if clicking outside the palette itself
  if (e.target === paletteContainer) {
    hideCommandPalette();
  }
}

// Populate menu items from WordPress admin menu
function populateMenuItems() {
  paletteItems = [];
  
  // Get admin menu items
  const adminMenu = document.getElementById('adminmenu');
  if (adminMenu) {
    const menuItems = adminMenu.querySelectorAll('li.menu-top');
    
    menuItems.forEach((item) => {
      const link = item.querySelector('a');
      if (link) {
        const text = link.textContent.trim();
        const url = link.href;
        const icon = item.querySelector('.wp-menu-image');
        let iconClass = '';
        
        if (icon) {
          // Extract icon class
          Array.from(icon.classList).forEach((cls) => {
            if (cls.startsWith('dashicons-')) {
              iconClass = cls;
            }
          });
        }
        
        paletteItems.push({
          type: 'menu',
          text: text,
          url: url,
          icon: iconClass
        });
        
        // Add submenu items
        const submenuItems = item.querySelectorAll('.wp-submenu li:not(.wp-submenu-head)');
        submenuItems.forEach((subitem) => {
          const sublink = subitem.querySelector('a');
          if (sublink) {
            const subtext = sublink.textContent.trim();
            const suburl = sublink.href;
            
            paletteItems.push({
              type: 'submenu',
              text: `${text} › ${subtext}`,
              url: suburl,
              parent: text,
              icon: iconClass
            });
          }
        });
      }
    });
  }
  
  // Add special items
  paletteItems.push({
    type: 'special',
    text: 'Turbo Admin Settings',
    action: 'openSettings',
    icon: 'dashicons-admin-settings'
  });
  
  // Render items
  renderItems(paletteItems);
}

// Filter items based on search term
function filterItems(searchTerm) {
  if (!searchTerm) {
    renderItems(paletteItems);
    return;
  }
  
  let filteredItems = [];
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Remove search mode prefix for matching
  let matchTerm = lowerSearchTerm;
  if (searchMode === 'content') {
    matchTerm = lowerSearchTerm.substring(1);
  } else if (searchMode === 'command') {
    matchTerm = lowerSearchTerm.substring(1);
  }
  
  // Filter based on search mode
  if (searchMode === 'content' && matchTerm) {
    // In a real implementation, this would call the WordPress REST API
    // For now, just show a placeholder
    filteredItems = [{
      type: 'message',
      text: 'Content search will be implemented with WordPress REST API',
      icon: 'dashicons-search'
    }];
  } else {
    // Regular menu item filtering
    filteredItems = paletteItems.filter(item => {
      return item.text.toLowerCase().includes(matchTerm);
    });
  }
  
  renderItems(filteredItems);
}

// Render items in the palette
function renderItems(items) {
  const itemsList = document.getElementById('ta-command-palette-items');
  itemsList.innerHTML = '';
  
  if (items.length === 0) {
    const noResults = document.createElement('li');
    noResults.className = 'ta-command-palette-no-results';
    noResults.textContent = 'No results found';
    itemsList.appendChild(noResults);
    return;
  }
  
  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'ta-command-palette-item';
    li.dataset.index = index;
    li.dataset.originalIndex = paletteItems.indexOf(item);
    
    if (index === selectedItemIndex) {
      li.classList.add('selected');
    }
    
    // Create icon
    const icon = document.createElement('span');
    icon.className = 'ta-command-palette-item-icon';
    if (item.icon) {
      icon.classList.add('dashicons', item.icon);
    }
    
    // Create text
    const text = document.createElement('span');
    text.className = 'ta-command-palette-item-text';
    text.textContent = item.text;
    
    li.appendChild(icon);
    li.appendChild(text);
    
    // Add click handler
    li.addEventListener('click', () => {
      selectedItemIndex = index;
      highlightSelectedItem();
      activateSelectedItem();
    });
    
    // Add mouseover handler
    li.addEventListener('mouseover', () => {
      selectedItemIndex = index;
      highlightSelectedItem();
    });
    
    itemsList.appendChild(li);
  });
}

// Select next item in the list
function selectNextItem() {
  const items = document.querySelectorAll('.ta-command-palette-item');
  if (items.length === 0) return;
  
  selectedItemIndex = (selectedItemIndex + 1) % items.length;
  highlightSelectedItem();
}

// Select previous item in the list
function selectPreviousItem() {
  const items = document.querySelectorAll('.ta-command-palette-item');
  if (items.length === 0) return;
  
  selectedItemIndex = (selectedItemIndex - 1 + items.length) % items.length;
  highlightSelectedItem();
}

// Highlight the selected item
function highlightSelectedItem() {
  const items = document.querySelectorAll('.ta-command-palette-item');
  
  items.forEach((item, index) => {
    if (index === selectedItemIndex) {
      item.classList.add('selected');
      // Ensure the selected item is visible
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

// Activate the selected item
function activateSelectedItem() {
  const items = document.querySelectorAll('.ta-command-palette-item');
  if (items.length === 0 || selectedItemIndex >= items.length) return;
  
  const selectedItem = items[selectedItemIndex];
  const index = parseInt(selectedItem.dataset.index);
  
  // Get the item from the currently displayed items, not from the original paletteItems
  // This ensures we're using the correct item that was clicked
  const currentItems = document.getElementById('ta-command-palette-items').children;
  const item = currentItems.length > 0 ? 
    (selectedItem.dataset.originalIndex ? paletteItems[parseInt(selectedItem.dataset.originalIndex)] : paletteItems[index]) : 
    null;
  
  if (item && item.url) {
    // Navigate to URL
    window.location.href = item.url;
  } else if (item && item.action === 'openSettings') {
    // Open settings (would be implemented in a real extension)
    alert('Settings would open here in a complete implementation');
  }
  
  hideCommandPalette();
}

// Apply UI enhancements based on settings
function applyUIEnhancements() {
  if (settings['block-editor-fullscreen-disable']) {
    // Disable block editor fullscreen mode
    document.body.classList.add('ta-disable-block-editor-fullscreen');
  }
  
  if (settings['block-editor-welcome-screen-kill']) {
    // Hide block editor welcome guide
    localStorage.setItem('wp_welcome_guide_shown', 'true');
  }
  
  if (settings['hide-notices']) {
    // Hide admin notices
    const notices = document.querySelectorAll('.notice:not(.notice-success), .error, .updated:not(.notice-success)');
    notices.forEach(notice => {
      notice.style.display = 'none';
    });
  }
  
  if (settings['admin-bar-search']) {
    // Add search to admin bar
    const adminBar = document.getElementById('wp-admin-bar-root-default');
    if (adminBar) {
      const searchLi = document.createElement('li');
      searchLi.id = 'wp-admin-bar-ta-search';
      searchLi.innerHTML = '<a href="#" class="ab-item"><span class="ab-icon dashicons dashicons-search"></span><span class="ab-label">Search</span></a>';
      
      searchLi.addEventListener('click', (e) => {
        e.preventDefault();
        togglePalette();
      });
      
      adminBar.appendChild(searchLi);
    }
  }
}

// Initialize when DOM is ready or immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded, initialize immediately
  init();
}