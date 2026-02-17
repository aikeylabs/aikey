// Content script - runs on AI websites to fill keys

import { siteAdapterManager } from '@/services/siteAdapter';

console.log('AiKey content script loaded');

// Listen for fill commands from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FILL_KEY_VALUE') {
    handleFillKey(message.payload)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleFillKey(payload: { apiKey: string; service: string }) {
  const domain = window.location.hostname;
  const adapter = siteAdapterManager.findAdapter(domain);

  if (!adapter) {
    throw new Error('No adapter found for this site');
  }

  const inputField = siteAdapterManager.findInputField(adapter);

  if (!inputField) {
    throw new Error('Could not find API key input field on this page');
  }

  await siteAdapterManager.fillField(adapter, inputField, payload.apiKey);

  // Show success notification
  showNotification('Filled your API key from AiKey', 'success');
}

function showNotification(message: string, type: 'success' | 'error') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#43A047' : '#E53935'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
