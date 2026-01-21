/**
 * Background Service Worker for Perplexity AI Capture
 */

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
    console.log(`📡 SSE event captured:`, message.event);
  }

  if (message.type === 'GET_CAPTURED_DATA') {
    sendResponse(capturedData);
  }

  if (message.type === 'CLEAR_CAPTURED_DATA') {
    capturedData.websocketMessages = [];
    capturedData.eventStreamEvents = [];
    capturedData.networkRequests = [];
    sendResponse({ success: true });
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
    }
    return { cancel: false };
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);
