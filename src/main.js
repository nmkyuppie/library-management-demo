import './style.css';
import { initDB, resetDB } from './db.js';

// Initialize the database and test data if not present
initDB();

// Global Setup logic
document.addEventListener('DOMContentLoaded', () => {
  // Inject Reset Button globally
  if (!document.getElementById('reset-container')) {
    const resetContainer = document.createElement('div');
    resetContainer.id = 'reset-container';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.setAttribute('data-testid', 'global-reset-btn');
    resetBtn.innerHTML = `
      <i class="ph ph-arrow-counter-clockwise"></i>
      Reset Data
    `;
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data? This will clear all changes.')) {
        resetDB();
      }
    });

    resetContainer.appendChild(resetBtn);
    document.body.appendChild(resetContainer);
  }
  // Feature #14: Global Keyboard Shortcut (Ctrl+K to focus search)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      const searchInput = document.getElementById('book-search');
      if (searchInput) {
        e.preventDefault(); // Prevent default browser search behavior
        searchInput.focus();
      }
    }
  });
});
