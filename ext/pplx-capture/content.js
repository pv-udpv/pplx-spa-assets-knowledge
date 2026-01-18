/**
 * Content script that runs in page context
 */

// Inject the capture script into page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'WEBSOCKET_MESSAGE_CAPTURED') {
    chrome.runtime.sendMessage({
      type: 'WEBSOCKET_MESSAGE',
      direction: event.data.direction,
      data: event.data.data,
    });
  }

  if (event.data.type === 'SSE_EVENT_CAPTURED') {
    chrome.runtime.sendMessage({
      type: 'SSE_EVENT',
      event: event.data.event,
      data: event.data.data,
    });
  }
});

// Expose API for page to trigger captures
window.pplxCapture = {
  getCapturedData: async () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CAPTURED_DATA' }, resolve);
    });
  },
  clearData: async () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'CLEAR_CAPTURED_DATA' }, resolve);
    });
  },
};

console.log('🔴 Perplexity AI Capture extension loaded');
