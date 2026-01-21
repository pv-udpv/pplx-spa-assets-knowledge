# Browser Automation & Data Capture Pipeline

Complete Chrome DevTools Protocol (CDP) integration for automated Perplexity AI interaction and data capture.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                Chrome Browser Instance                      │
│  (Headless or GUI with CDP enabled)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐     ┌──────────────────────┐    │
│  │  Extension Inject    │     │  CDP Network Layer   │    │
│  │  (WebSocket, SSE,    │     │  (HAR, HTTP/2,      │    │
│  │   Fetch intercept)   │     │   Timings)          │    │
│  └──────────────────────┘     └──────────────────────┘    │
│           │                            │                   │
│           └────────────┬────────────────┘                  │
│                        │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                    [Message Queue]
                          │
┌─────────────────────────┼────────────────────────────────────┐
│            BrowserAutomation (Node.js)                      │
│                        │                                    │
│  ┌────────────────────▼─────────────────┐                  │
│  │     CDPClient                        │                  │
│  │  ┌──────────────────────────────┐   │                  │
│  │  │ Capture Data                 │   │                  │
│  │  │ • HAR (Network)              │   │                  │
│  │  │ • WebSocket Messages (WS)    │   │                  │
│  │  │ • SSE Events                 │   │                  │
│  │  │ • Storage (LS/SS/Cookies)    │   │                  │
│  │  │ • Callstacks                 │   │                  │
│  │  │ • Console Logs               │   │                  │
│  │  │ • Performance Timings        │   │                  │
│  │  └──────────────────────────────┘   │                  │
│  └────────────────────────────────────┘                   │
│                                                             │
│  Task Execution:                                            │
│  • Navigate(url) → wait for networkidle2                    │
│  • ExecuteWithCapture(async fn)                            │
│  • CaptureStorage()                                         │
│  • SaveCapture(outputDir)                                  │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    HAR File       WebSocket Log      Storage JSON
 (.har.json)      (.ws.jsonl)         (.storage.json)
```

## Installation

### Prerequisites

```bash
# Install Chrome DevTools Protocol client
npm install chrome-remote-interface

# Ensure Google Chrome or Chromium is installed
which google-chrome  # or: which chromium-browser
```

### Extension Setup

```bash
# Extension is pre-built in ext/pplx-capture/
# It will be auto-loaded when running browser automation with --extension enabled

# Verify extension files exist:
ls -la ext/pplx-capture/
# Should contain: manifest.json, background.js, content.js, inject.js
```

## Usage

### Basic Browser Automation

```bash
# Run with default preset (apiReversing)
npm run browser -- --url "https://www.perplexity.ai"

# Run with specific preset
npm run browser -- --preset full --url "https://www.perplexity.ai"

# Run with custom output
npm run browser -- --preset minimal --output ./my-captures

# Run in GUI mode (non-headless)
npm run browser -- --headless false --preset development
```

### Capture Presets

#### 1. Minimal
Network HAR only, fast, low data volume.
```bash
node dist/cli.js browser --preset minimal
```

**Captures:**
- HAR (network requests/responses)
- Network timings

**Use Case:** Lightweight API reverse engineering

#### 2. API Reversing (default)
Optimal for reverse engineering REST/GraphQL APIs.
```bash
node dist/cli.js browser --preset apiReversing
```

**Captures:**
- HAR (network)
- WebSocket messages
- SSE events
- Storage (localStorage, sessionStorage, cookies)
- Network performance metrics

**Use Case:** Full API reverse engineering with state tracking

#### 3. Full
Everything captured.
```bash
node dist/cli.js browser --preset full
```

**Captures:**
- HAR (network)
- WebSocket messages
- SSE events
- Storage (all)
- Callstacks
- Console logs
- DOM snapshots
- Performance metrics

**Use Case:** Deep debugging, security analysis

#### 4. Development
Full capture with GUI (non-headless).
```bash
node dist/cli.js browser --preset development
```

**Best for:** Interactive testing and debugging during development

## Custom Workflows

### Programmatic Usage

```typescript
import { runBrowserSession, capturePresets } from './src/browser/browser-automation';

// Custom configuration
const config = {
  ...capturePresets.apiReversing,
  chrome: {
    port: 9222,
    host: 'localhost',
    executable: '/usr/bin/google-chrome',
  },
  output: {
    dir: './my-captures',
    format: 'json',
    compress: false,
  },
};

await runBrowserSession(config, async (browser) => {
  const cdp = browser.getCDPClient();

  // Task 1: Navigate
  await browser.executeTask('Navigate to Perplexity', async () => {
    await cdp.navigate('https://www.perplexity.ai', { waitUntil: 'networkidle2' });
  });

  // Wait for page to be interactive
  await new Promise(r => setTimeout(r, 2000));

  // Task 2: Search
  await browser.executeTask('Perform Search', async () => {
    await cdp.executeJavaScript(`
      // Your custom search logic here
      const input = document.querySelector('input[type="text"]');
      input.value = 'artificial intelligence';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.form.submit();
    `);
  });

  // Task 3: Wait for response
  await browser.executeTask('Wait for Response', async () => {
    await new Promise(r => setTimeout(r, 5000));
  });

  // Task 4: Extract data
  await browser.executeTask('Extract Results', async () => {
    const results = await cdp.executeJavaScript(`
      JSON.stringify(document.querySelectorAll('.result').length)
    `);
    console.log('Found results:', results);
  });
});
```

### Workflow Examples

#### Example 1: API Discovery

```bash
#!/bin/bash

echo "🔍 API Discovery Workflow"

# Start capture with API preset
npm run browser -- \
  --preset apiReversing \
  --url "https://www.perplexity.ai" \
  --output ./api-discovery

# Analyze captured HAR
cat ./api-discovery/capture-*.har.json | \
  jq '.log.entries[] | {url: .request.url, method: .request.method}'

# Extract WebSocket traffic
cat ./api-discovery/capture-*.ws.jsonl | jq -s 'group_by(.data.url)'
```

#### Example 2: State Tracking

```bash
#!/bin/bash

echo "📊 State Tracking Workflow"

# Capture with full storage
npm run browser -- \
  --preset full \
  --url "https://www.perplexity.ai" \
  --output ./state-tracking

# Extract localStorage changes
cat ./state-tracking/capture-*.storage.json | jq '.localStorage'

# Extract cookies
cat ./state-tracking/capture-*.storage.json | jq '.cookies'
```

#### Example 3: Automated Testing

```typescript
// scripts/test-perplexity-flow.ts

import { runBrowserSession, capturePresets } from './src/browser/browser-automation';

async function testSearchFlow() {
  const config = {
    ...capturePresets.apiReversing,
    output: { dir: './test-results' },
  };

  await runBrowserSession(config, async (browser) => {
    const cdp = browser.getCDPClient();

    // Test 1: Load homepage
    await browser.executeTask('Load Homepage', async () => {
      await cdp.navigate('https://www.perplexity.ai');
    });

    // Test 2: Perform search
    await browser.executeTask('Search', async () => {
      await cdp.executeJavaScript(`
        const search = document.querySelector('[data-testid="search-input"]');
        search.focus();
        search.textContent = 'What is quantum computing?';
        search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      `);
    });

    // Test 3: Wait for results
    await browser.executeTask('Wait for Results', async () => {
      await new Promise(r => setTimeout(r, 10000));
    });

    // Test 4: Capture results
    await browser.executeTask('Capture Results', async () => {
      const results = await cdp.executeJavaScript(`
        JSON.stringify({
          count: document.querySelectorAll('.result').length,
          firstResult: document.querySelector('.result')?.textContent?.substring(0, 100),
        })
      `);
      console.log('Results:', results);
    });
  });
}

testSearchFlow().catch(console.error);
```

## Output Structure

### HAR File (.har.json)
```json
{
  "log": {
    "version": "1.2",
    "creator": { "name": "pplx-spa-assets", "version": "1.0" },
    "entries": [
      {
        "startedDateTime": "2026-01-18T23:30:00Z",
        "request": {
          "method": "GET",
          "url": "https://api.perplexity.ai/...",
          "headers": [...],
          "queryString": [...]
        },
        "response": {
          "status": 200,
          "statusText": "OK",
          "headers": [...],
          "content": {...}
        },
        "timings": {
          "wait": 145,
          "receive": 234
        }
      }
    ]
  }
}
```

### WebSocket Log (.ws.jsonl)
```jsonl
{"tabId": 1, "url": "wss://api.perplexity.ai/ws", "direction": "send", "data": {...}, "timestamp": 1705614600000}
{"tabId": 1, "url": "wss://api.perplexity.ai/ws", "direction": "receive", "data": {...}, "timestamp": 1705614600145}
```

### Storage (.storage.json)
```json
{
  "localStorage": {
    "user_id": "abc123",
    "session_token": "...",
    "preferences": "{...}"
  },
  "sessionStorage": {...},
  "cookies": [
    {
      "name": "__Secure-next-auth.session-token",
      "value": "...",
      "domain": ".perplexity.ai",
      "path": "/",
      "secure": true,
      "httpOnly": true
    }
  ]
}
```

### Metadata (.metadata.json)
```json
{
  "timestamp": "2026-01-18T23:30:00Z",
  "url": "https://www.perplexity.ai",
  "networkTimings": {
    "Navigate to Perplexity": 3245,
    "Perform Search": 1542,
    "Wait for Response": 5000
  },
  "callstacks": [...],
  "console": [...]
}
```

## Extension Architecture

### Files

- **manifest.json** - Manifest v3 configuration
- **background.js** - Service Worker, message routing
- **content.js** - Content script in page context
- **inject.js** - Injected script with WebSocket/EventSource interception

### Data Flow

```
Page Context (inject.js)
  ├─ WebSocket intercept → postMessage
  ├─ EventSource intercept → postMessage
  └─ Fetch intercept → postMessage
       │
       └─ Content Script (content.js)
            └─ chrome.runtime.sendMessage
                 │
                 └─ Background Worker (background.js)
                      └─ Store in memory + respond to CDP client
```

## Performance Considerations

### Memory Usage

- **Minimal preset**: ~50-100 MB
- **API Reversing preset**: ~100-200 MB
- **Full preset**: ~200-500 MB

### Network Impact

- HAR recording: Minimal overhead (~1-2%)
- WebSocket capture: Low overhead (~1%)
- Extension injection: Negligible (~0.1%)

### Recommended Settings

```bash
# For long sessions, increase Node heap
NODE_OPTIONS="--max-old-space-size=2048" npm run browser

# Increase Chrome timeout for slow networks
node dist/cli.js browser --timeout 60000
```

## Troubleshooting

### Chrome Connection Failed

```bash
# Make sure Chrome is installed
which google-chrome

# Start Chrome manually with debugging
google-chrome --remote-debugging-port=9222 &

# Then run browser command
npm run browser
```

### Extension Not Loading

```bash
# Check extension path
ls -la ext/pplx-capture/

# Verify manifest.json
cat ext/pplx-capture/manifest.json

# Run with extension debugging
CHROME_DEBUG=1 npm run browser
```

### WebSocket Capture Not Working

```bash
# Check Chrome version (requires v90+)
google-chrome --version

# Verify extension in Chrome DevTools
# chrome://extensions → Look for "Perplexity AI Capture"

# Check background.js errors
# chrome://extensions → Developer mode → Background page
```

## Integration with Analysis Pipeline

### From Browser Capture to OpenAPI

```bash
#!/bin/bash

# 1. Capture browser session
npm run browser -- --preset apiReversing --output ./session-1

# 2. Extract HAR
HAR_FILE=$(ls ./session-1/*.har.json | head -1)

# 3. Parse HAR to identify endpoints (TODO: har-to-openapi tool)
# This would extract endpoints from HAR and generate OpenAPI spec

# 4. Generate MCP server
npm run generate -- --input ./parsed --output ./specs
npm run mcp:generate -- --spec ./specs/openapi/api-v1.yaml
```

## Next Steps

1. Implement HAR parsing to extract API endpoints automatically
2. Add support for GraphQL query capture
3. Implement WebSocket message schema extraction
4. Add performance profiling integration
5. Create automated diff detection for API changes
