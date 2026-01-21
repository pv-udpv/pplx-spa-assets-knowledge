/**
 * Background Service Worker for Perplexity AI Capture
 */

// Maximum number of items to keep in memory (prevent memory exhaustion)
const MAX_ITEMS = 1000;

const capturedData = {
  websocketMessages: [],
  eventStreamEvents: [],
  networkRequests: [],
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WEBSOCKET_MESSAGE') {
    capturedData.websocketMessages.push({
      tabId: sender.tab?.id,
      url: sender.url,
      timestamp: Date.now(),
      direction: message.direction, // 'send' or 'receive'
      data: message.data,
      size: JSON.stringify(message.data).length,
    });

    // Implement ring buffer to prevent memory exhaustion
    if (capturedData.websocketMessages.length > MAX_ITEMS) {
      capturedData.websocketMessages.shift();
    }

    console.log(`📨 WebSocket message captured:`, message.data);
  }

  if (message.type === 'SSE_EVENT') {
    capturedData.eventStreamEvents.push({
      tabId: sender.tab?.id,
      url: sender.url,
      timestamp: Date.now(),
      event: message.event,
      data: message.data,
    });

    // Implement ring buffer to prevent memory exhaustion
    if (capturedData.eventStreamEvents.length > MAX_ITEMS) {
      capturedData.eventStreamEvents.shift();
    }

    console.log(`📡 SSE event captured:`, message.event);
  }

  if (message.type === 'GET_CAPTURED_DATA') {
    sendResponse(capturedData);
    return true; // Indicate async response
  }

  if (message.type === 'CLEAR_CAPTURED_DATA') {
    capturedData.websocketMessages = [];
    capturedData.eventStreamEvents = [];
    capturedData.networkRequests = [];
    sendResponse({ success: true });
    return true; // Indicate async response
  }
});

// Track network requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type === 'xmlhttprequest' || details.type === 'fetch') {
      capturedData.networkRequests.push({
        tabId: details.tabId,
        url: details.url,
        method: details.method,
        timestamp: Date.now(),
        type: details.type,
      });

      // Implement ring buffer to prevent memory exhaustion
      if (capturedData.networkRequests.length > MAX_ITEMS) {
        capturedData.networkRequests.shift();
      }
    }
    return { cancel: false };
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);
