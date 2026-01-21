/**
 * Injected script that runs in page context with full access
 */

// Capture WebSocket messages
const OriginalWebSocket = window.WebSocket;

window.WebSocket = class CaptureWebSocket extends OriginalWebSocket {
  constructor(url, protocols) {
    super(url, protocols);
    this.url = url;

    // Store original addEventListener to use in the instance
    const originalAddEventListener = super.addEventListener;
    const wsUrl = url; // Capture URL in closure

    // Override addEventListener on this instance
    this.addEventListener = function (event, handler, options) {
      if (event === 'message') {
        const wrappedHandler = function (e) {
          window.postMessage(
            {
              type: 'WEBSOCKET_MESSAGE_CAPTURED',
              direction: 'receive',
              data: {
                url: wsUrl,
                message: e.data,
                timestamp: Date.now(),
              },
            },
            '*'
          );
          return handler.call(this, e);
        };
        return originalAddEventListener.call(this, event, wrappedHandler, options);
      }
      return originalAddEventListener.call(this, event, handler, options);
    }.bind(this);
  }

  send(data) {
    window.postMessage(
      {
        type: 'WEBSOCKET_MESSAGE_CAPTURED',
        direction: 'send',
        data: {
          url: this.url,
          message: typeof data === 'string' ? data : new TextDecoder().decode(data),
          timestamp: Date.now(),
        },
      },
      '*'
    );
    return super.send(data);
  }
};

// Capture EventSource (Server-Sent Events)
const OriginalEventSource = window.EventSource;

window.EventSource = class CaptureEventSource extends OriginalEventSource {
  constructor(url, eventSourceInitDict) {
    super(url, eventSourceInitDict);
    const sseUrl = url; // Capture URL in closure

    const originalAddEventListener = this.addEventListener.bind(this);
    this.addEventListener = function (event, handler, options) {
      if (event !== 'open' && event !== 'error') {
        const wrappedHandler = function (e) {
          window.postMessage(
            {
              type: 'SSE_EVENT_CAPTURED',
              event: event,
              data: {
                url: sseUrl,
                eventType: event,
                data: e.data,
                timestamp: Date.now(),
              },
            },
            '*'
          );
          return handler.call(this, e);
        };
        return originalAddEventListener(event, wrappedHandler, options);
      }
      return originalAddEventListener(event, handler, options);
    };
  }
};

// Capture fetch calls
const OriginalFetch = window.fetch;

window.fetch = function (...args) {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource.url;
  const method = (config?.method || 'GET').toUpperCase();

  const startTime = performance.now();

  return OriginalFetch.apply(this, args)
    .then((response) => {
      const duration = performance.now() - startTime;
      window.postMessage(
        {
          type: 'FETCH_CAPTURED',
          data: {
            url,
            method,
            status: response.status,
            duration,
            timestamp: Date.now(),
          },
        },
        '*'
      );
      return response;
    })
    .catch((error) => {
      window.postMessage(
        {
          type: 'FETCH_ERROR',
          data: {
            url,
            method,
            error: error.message,
            timestamp: Date.now(),
          },
        },
        '*'
      );
      throw error;
    });
};

console.log('🔴 Perplexity AI Capture inject script loaded');
