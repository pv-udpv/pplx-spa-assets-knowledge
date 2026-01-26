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

# 3. Convert HAR to OpenAPI specification
python3 scripts/har_to_openapi.py $HAR_FILE -o ./specs/api.yaml

# 4. Generate MCP server
npm run mcp:generate -- --spec ./specs/api.yaml
```

### WebSocket Schema Extraction

```bash
#!/bin/bash

# 1. Capture browser session with WebSocket messages
npm run browser -- --preset apiReversing --output ./session-ws

# 2. Extract WebSocket log
WS_FILE=$(ls ./session-ws/*.ws.jsonl | head -1)

# 3. Generate AsyncAPI specification
python3 scripts/ws_schema_extractor.py $WS_FILE -o ./specs/websocket-api.yaml

# 4. Review the AsyncAPI spec
cat ./specs/websocket-api.yaml
```

### GraphQL Query Extraction

```bash
#!/bin/bash

# 1. Capture browser session
npm run browser -- --preset apiReversing --output ./session-graphql

# 2. Extract HAR
HAR_FILE=$(ls ./session-graphql/*.har.json | head -1)

# 3. Extract GraphQL queries
python3 scripts/graphql_extractor.py $HAR_FILE -o ./graphql-queries/ --group --pretty

# 4. Review extracted queries
ls -la ./graphql-queries/
```

## Advanced Analysis Tools

### 1. HAR-to-OpenAPI Converter

Extract REST API endpoints from HAR files and generate OpenAPI 3.0 specifications.

**Features:**
- Automatic path parameter detection (IDs, UUIDs, hashes)
- Request/response schema inference
- Query parameter extraction
- Multiple server support

**Usage:**
```bash
# Convert HAR to OpenAPI YAML
npm run analyze:har -- input.har.json -o output.yaml

# Convert to JSON with pretty printing
npm run analyze:har -- input.har.json -o output.json --format json --pretty

# Direct Python usage
python3 scripts/har_to_openapi.py input.har.json -o output.yaml
```

**Example Output:**
```yaml
openapi: 3.0.0
info:
  title: API extracted from HAR
  version: 1.0.0
servers:
  - url: https://api.example.com
paths:
  /api/user/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: integer }
                  name: { type: string }
```

### 2. WebSocket Schema Extractor

Extract JSON schemas from WebSocket message logs and generate AsyncAPI specifications.

**Features:**
- Schema inference using genson library
- Message type detection (send/receive)
- Multiple WebSocket URL support
- AsyncAPI 2.6.0 format

**Usage:**
```bash
# Extract schemas to YAML
npm run analyze:ws -- input.ws.jsonl -o asyncapi.yaml

# Extract to JSON
npm run analyze:ws -- input.ws.jsonl -o asyncapi.json --format json --pretty

# Direct Python usage
python3 scripts/ws_schema_extractor.py input.ws.jsonl -o asyncapi.yaml
```

**Input Format (.ws.jsonl):**
```jsonl
{"tabId": 1, "url": "wss://api.example.com/ws", "direction": "send", "data": {"type": "subscribe", "channel": "updates"}, "timestamp": 1705614600000}
{"tabId": 1, "url": "wss://api.example.com/ws", "direction": "receive", "data": {"type": "message", "content": "Hello"}, "timestamp": 1705614600145}
```

### 3. GraphQL Query Extractor

Extract and organize GraphQL queries, mutations, and subscriptions from HAR files.

**Features:**
- Automatic GraphQL request detection
- Query/mutation/subscription parsing
- Variable extraction
- Operation name grouping
- Multiple output formats

**Usage:**
```bash
# Extract to directory (one file per operation)
npm run analyze:graphql -- input.har.json -o ./queries/

# Extract to single JSON file with grouping
npm run analyze:graphql -- input.har.json -o queries.json --format json --group --pretty

# Direct Python usage
python3 scripts/graphql_extractor.py input.har.json -o ./queries/ --group
```

**Output Structure:**
```json
{
  "operation_name": "GetUser",
  "operation_type": "query",
  "query": "query GetUser($id: ID!) { user(id: $id) { id name email } }",
  "variables": { "id": "123" },
  "url": "https://api.example.com/graphql",
  "response": { "data": { "user": { "id": "123", "name": "John" } } }
}
```

### 4. Request Replayer

Replay HTTP requests from HAR files with modifications and fuzzing support.

**Features:**
- Filter requests by URL pattern
- Modify headers and body before replay
- Add delay between requests
- Fuzzing mode with payload variations
- Result recording and statistics

**Usage (via TypeScript):**
```typescript
import { RequestReplayer } from './src/browser/request-replayer.js';
import { CDPClient } from './src/browser/cdp-client.js';

const cdp = new CDPClient(config);
await cdp.connect();

const replayer = new RequestReplayer(cdp, './capture.har.json');

// Replay filtered requests
await replayer.replay(
  (entry) => entry.request.url.includes('/api/'),
  {
    delay: 1000,
    modifyHeaders: (headers) => {
      headers['Authorization'] = 'Bearer new-token';
      return headers;
    }
  }
);

// Fuzzing mode
await replayer.fuzzing('/api/user', [
  { id: 1 },
  { id: -1 },
  { id: 'invalid' },
  { id: null }
]);

// Get statistics
const stats = replayer.getStatistics();
console.log(stats);
```

**CLI Usage:**
```bash
# Replay requests (placeholder - requires browser automation)
npm run replay -- --har capture.har.json --filter "/api/" --delay 1000
```

### 5. Session State Manager

Capture, restore, and diff browser session states including storage, cookies, and DOM.

**Features:**
- Full state snapshots (localStorage, sessionStorage, cookies, URL, DOM)
- State restoration
- Diff comparison between snapshots
- Export/import snapshots to files
- Snapshot management (list, delete)

**Usage (via TypeScript):**
```typescript
import { SessionStateManager } from './src/browser/state-manager.js';
import { CDPClient } from './src/browser/cdp-client.js';

const cdp = new CDPClient(config);
await cdp.connect();

const stateManager = new SessionStateManager(cdp);

// Capture snapshots
await stateManager.captureSnapshot('before-login');
// ... perform actions ...
await stateManager.captureSnapshot('after-login');

// Compare snapshots
const diff = await stateManager.diffSnapshots('before-login', 'after-login');
console.log('Changes:', diff);

// Export snapshot
await stateManager.exportSnapshot('after-login', './snapshots/after-login.json');

// Restore snapshot
await stateManager.restoreSnapshot('before-login');

// List snapshots
const snapshots = stateManager.listSnapshots();
console.log(snapshots);
```

**CLI Usage:**
```bash
# Diff two snapshot files
npm run diff -- --before before.json --after after.json -o diff.json
```

### 6. Anti-Bot Detection Analyzer

Analyze website protection mechanisms and fingerprinting techniques.

**Features:**
- Bot protection detection (Cloudflare, reCAPTCHA, hCAPTCHA)
- Fingerprinting technique analysis
- WebDriver detection
- Canvas/WebRTC fingerprinting detection
- Suspicious script identification
- Security header analysis

**Usage (via TypeScript):**
```typescript
import { AntiBotAnalyzer } from './src/browser/anti-bot-analyzer.js';
import { CDPClient } from './src/browser/cdp-client.js';

const cdp = new CDPClient(config);
await cdp.connect();

const analyzer = new AntiBotAnalyzer(cdp);
const result = await analyzer.analyzeProtection();

console.log('Cloudflare:', result.cloudflare);
console.log('reCAPTCHA:', result.recaptcha);
console.log('Canvas Fingerprinting:', result.canvas);
console.log('WebDriver Exposed:', result.webdriver);
console.log('Fingerprinting Techniques:', result.fingerprinting);
```

**CLI Usage:**
```bash
# Analyze website (placeholder - requires browser automation)
npm run antibot -- --url "https://example.com" -o analysis.json
```

## Troubleshooting

### Python Scripts

#### Missing Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Or install individually
pip install pyyaml jsonschema genson
```

#### Import Errors

```bash
# Check Python version (requires 3.12+)
python3 --version

# Verify installations
python3 -c "import yaml; import jsonschema; from genson import SchemaBuilder"
```

#### Invalid HAR Format

If you get JSON decode errors:
```bash
# Validate HAR file
cat input.har.json | python3 -m json.tool > /dev/null

# Check file encoding
file input.har.json
```

### TypeScript Modules

#### Build Errors

```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

#### Runtime Errors

The TypeScript modules (RequestReplayer, SessionStateManager, AntiBotAnalyzer) require:
1. CDPClient instance connected to Chrome
2. Browser automation session active
3. Proper CDP domain enablement

Refer to existing browser automation examples for integration.

## Workflow Examples

### Complete API Reverse Engineering

```bash
#!/bin/bash

echo "🔍 Complete API Reverse Engineering Workflow"

# 1. Capture browser session
npm run browser -- --preset apiReversing --url "https://api.example.com" --output ./capture

# 2. Find captured files
HAR_FILE=$(ls ./capture/*.har.json | head -1)
WS_FILE=$(ls ./capture/*.ws.jsonl | head -1)

# 3. Extract REST API endpoints
python3 scripts/har_to_openapi.py $HAR_FILE -o ./specs/rest-api.yaml

# 4. Extract WebSocket API
if [ -f "$WS_FILE" ]; then
  python3 scripts/ws_schema_extractor.py $WS_FILE -o ./specs/websocket-api.yaml
fi

# 5. Extract GraphQL queries
python3 scripts/graphql_extractor.py $HAR_FILE -o ./graphql-queries/ --group --pretty

echo "✅ Analysis complete!"
echo "   REST API: ./specs/rest-api.yaml"
echo "   WebSocket API: ./specs/websocket-api.yaml"
echo "   GraphQL Queries: ./graphql-queries/"
```

### State Change Analysis

```bash
#!/bin/bash

echo "📊 State Change Analysis Workflow"

# 1. Capture before state
npm run browser -- --preset full --output ./state-before
# ... perform manual actions in browser ...

# 2. Capture after state
npm run browser -- --preset full --output ./state-after

# 3. Extract storage files
BEFORE=$(ls ./state-before/*.storage.json | head -1)
AFTER=$(ls ./state-after/*.storage.json | head -1)

# 4. Diff states
npm run diff -- --before $BEFORE --after $AFTER -o state-diff.json

# 5. Review changes
cat state-diff.json | jq '.changes'
```

## Next Steps

The following enhancements are planned:
1. ✅ HAR-to-OpenAPI converter - **COMPLETED**
2. ✅ WebSocket schema extraction - **COMPLETED**
3. ✅ GraphQL query extraction - **COMPLETED**
4. ✅ Request replay and fuzzing - **COMPLETED**
5. ✅ Session state management - **COMPLETED**
6. ✅ Anti-bot detection analysis - **COMPLETED**
7. Integration of replay/state/antibot with live browser sessions
8. Performance profiling integration
9. Automated API change detection
10. Machine learning-based endpoint clustering
