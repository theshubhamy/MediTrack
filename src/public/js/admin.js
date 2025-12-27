/**
 * Admin Dashboard Enhanced Features
 * - Dark Mode
 * - Keyboard Shortcuts
 * - Quick Actions Panel
 * - Tooltips
 * - Loading States
 */

(function () {
  'use strict';

  // Dark Mode Toggle
  function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('admin-theme') || 'light';

    // Apply saved theme
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeToggle) themeToggle.textContent = '☀️';
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('admin-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      });
    }
  }

  // Keyboard Shortcuts
  function initKeyboardShortcuts() {
    const shortcuts = {
      d: () => (window.location.href = '/admin'),
      u: () => (window.location.href = '/admin/users'),
      c: () => (window.location.href = '/admin/clinics'),
      a: () => (window.location.href = '/admin/analytics'),
      '?': () => toggleHelpPanel(),
      t: () => toggleTheme(),
      q: () => toggleQuickActions(),
      Escape: () => closeAllPanels(),
    };

    document.addEventListener('keydown', e => {
      // Don't trigger if typing in input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const shortcut = shortcuts[key] || shortcuts[e.key];

      if (shortcut && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        shortcut();
      }
    });

    // Show keyboard shortcuts hint
    showKeyboardShortcutsHint();
  }

  function toggleTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.click();
  }

  function toggleQuickActions() {
    const menu = document.getElementById('quick-actions-menu');
    if (menu) {
      menu.classList.toggle('active');
    }
  }

  function toggleHelpPanel() {
    const panel = document.getElementById('help-panel');
    const overlay = document.getElementById('help-overlay');

    if (panel && overlay) {
      panel.classList.toggle('active');
      overlay.classList.toggle('active');
    }
  }

  function closeAllPanels() {
    const menu = document.getElementById('quick-actions-menu');
    const helpPanel = document.getElementById('help-panel');
    const helpOverlay = document.getElementById('help-overlay');

    if (menu) menu.classList.remove('active');
    if (helpPanel) helpPanel.classList.remove('active');
    if (helpOverlay) helpOverlay.classList.remove('active');
  }

  function showKeyboardShortcutsHint() {
    // Show hint on first visit
    if (!localStorage.getItem('admin-shortcuts-shown')) {
      setTimeout(() => {
        const hint = document.createElement('div');
        hint.className =
          'fixed bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        hint.innerHTML =
          '💡 Press <kbd class="key">?</kbd> for keyboard shortcuts';
        document.body.appendChild(hint);

        setTimeout(() => {
          hint.remove();
          localStorage.setItem('admin-shortcuts-shown', 'true');
        }, 5000);
      }, 2000);
    }
  }

  // Quick Actions Panel
  function initQuickActions() {
    const btn = document.getElementById('quick-actions-btn');
    const menu = document.getElementById('quick-actions-menu');

    if (btn && menu) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('active');
      });

      // Close on outside click
      document.addEventListener('click', e => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove('active');
        }
      });
    }
  }

  // Tooltips
  function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
      const tooltipText = element.getAttribute('data-tooltip');
      if (!tooltipText) return;

      const tooltip = document.createElement('span');
      tooltip.className = 'tooltiptext';
      tooltip.textContent = tooltipText;

      element.classList.add('tooltip');
      element.appendChild(tooltip);
    });
  }

  // Loading States
  function initLoadingStates() {
    // Show loading on form submissions
    const forms = document.querySelectorAll('form[data-loading]');
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        showLoading();
      });
    });

    // Show loading on link clicks with data-loading attribute
    const loadingLinks = document.querySelectorAll('a[data-loading]');
    loadingLinks.forEach(link => {
      link.addEventListener('click', () => {
        showLoading();
      });
    });
  }

  function showLoading() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loading-spinner"></div>';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  // Help Panel
  function initHelpPanel() {
    const helpOverlay = document.getElementById('help-overlay');
    if (helpOverlay) {
      helpOverlay.addEventListener('click', () => {
        closeAllPanels();
      });
    }
  }

  // Initialize all features when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initDarkMode();
    initKeyboardShortcuts();
    initQuickActions();
    initTooltips();
    initLoadingStates();
    initHelpPanel();

    // Hide loading on page load
    hideLoading();
  }

  // Export functions for global use
  window.adminUtils = {
    showLoading,
    hideLoading,
    toggleTheme,
    toggleQuickActions,
    toggleHelpPanel,
  };
})();
