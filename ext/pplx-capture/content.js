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

  const data = event.data;

  // Validate basic message structure
  if (!data || typeof data !== 'object') {
    return;
  }

  const type = data.type;
  if (type !== 'WEBSOCKET_MESSAGE_CAPTURED' && type !== 'SSE_EVENT_CAPTURED') {
    return;
  }

  if (type === 'WEBSOCKET_MESSAGE_CAPTURED') {
    // Validate expected fields for websocket messages
    if (typeof data.direction !== 'string') {
      return;
    }

    chrome.runtime.sendMessage({
      type: 'WEBSOCKET_MESSAGE',
      direction: data.direction,
      data: data.data,
    });
  } else if (type === 'SSE_EVENT_CAPTURED') {
    // Validate expected fields for SSE events
    if (typeof data.event !== 'string') {
      return;
    }

    chrome.runtime.sendMessage({
      type: 'SSE_EVENT',
      event: data.event,
      data: data.data,
    });
  }
});

// Note: pplxCapture API is intentionally not exposed on window
// to avoid unauthenticated access from arbitrary page scripts.

console.log('🔴 Perplexity AI Capture extension loaded');
