# Knowledge Base Documentation

## Project Overview

**Project Name:** pplx-spa-assets-knowledge  
**Version:** 1.0.0  
**License:** MIT  
**Author:** pv-udpv  

### Description

A comprehensive TypeScript-based toolkit for analyzing Perplexity AI Single Page Application (SPA) static assets, generating structured API specifications (OpenAPI, AsyncAPI, JSON Schema), and building knowledge bases. The project enables systematic reverse engineering, documentation, and integration of Perplexity AI's web platform through automated asset parsing, endpoint extraction, and MCP (Model Context Protocol) server generation.

### Key Features

- **Asset Fetcher**: Concurrent HTTP/HTTPS downloader with retry logic and exponential backoff
- **TypeScript AST Parser**: Advanced code analysis using ts-morph for extracting types, interfaces, classes, enums, and API endpoints
- **Specification Generators**: 
  - OpenAPI v3.1 (REST API specifications)
  - AsyncAPI v3.0 (WebSocket/event-driven specifications)
  - JSON Schema (data model definitions)
- **MCP Server Generator**: Automatic Model Context Protocol server generation from OpenAPI specs
- **Knowledge Base Builder**: Structured knowledge extraction and entity relationship mapping
- **Browser Automation**: Chrome DevTools Protocol integration for live API capture
- **automcp Integration**: Configuration generator for seamless MCP tool registration

### Integration with Perplexity AI Ecosystem

This repository serves as the foundation for Perplexity AI API analysis and integration:

- **pplx-api-client**: Unofficial Python/TypeScript client libraries built from generated OpenAPI specs
- **pplx-mcp-server**: MCP server implementations for Claude Desktop and Cline integration
- **Reverse Engineering**: Systematic documentation of Perplexity AI's frontend architecture and API surface

## Project Statistics

### Typical Analysis Results

Based on comprehensive SPA analysis:

- **HAR Entries**: ~786 network requests captured
- **JavaScript Modules**: 752 total (397 application modules, 322 vendor modules, 33 internal)
- **REST Endpoints**: ~404 discovered API endpoints
- **REST Categories**: ~53 functional endpoint groups
- **SSE Endpoints**: ~14 Server-Sent Events endpoints
- **Source Size**: 3.37 MB original → 1.2 MB compressed (gzip)

### Repository Statistics

- **TypeScript Files**: ~20 core modules
- **Lines of Code**: ~3,000+ (core implementation)
- **Dependencies**: 12 production, 4 development
- **CLI Commands**: 7 primary commands (browser, fetch, analyze, parse, generate, mcp, automcp, kb)

## Core Artifacts Documentation

### 1. Full SPA Specification (`perplexity_spa_full_spec.json`)

**Size:** ~1.9 MB  
**Format:** JSON  
**Description:** Complete specification of Perplexity AI SPA including all discovered endpoints, types, WebSocket channels, and event streams.

**Structure:**
```json
{
  "openapi": "3.1.0",
  "info": { "title": "Perplexity AI API", "version": "1.0.0" },
  "servers": [{ "url": "https://www.perplexity.ai" }],
  "paths": {
    "/api/search": { "post": {...} },
    "/api/threads": { "get": {...}, "post": {...} }
  },
  "components": {
    "schemas": { "SearchQuery": {...}, "Thread": {...} }
  }
}
```

**Usage:** Import into API testing tools (Postman, Insomnia), code generation (openapi-generator), or documentation sites (Redoc, SwaggerUI).

### 2. REST Endpoints Specification (`perplexity_endpoints_spec.json`)

**Size:** ~37 KB  
**Format:** JSON  
**Description:** Focused OpenAPI specification containing only REST API endpoints, optimized for client library generation.

**Key Sections:**
- Authentication endpoints (`/api/auth/*`)
- Search endpoints (`/api/search`, `/api/suggest`)
- Thread management (`/api/threads/*`)
- User profile (`/api/user/*`)
- Collections (`/api/collections/*`)

### 3. Source Code Index (`perplexity_source_index.json`)

**Size:** ~118 KB  
**Format:** JSON  
**Description:** Comprehensive index of all analyzed JavaScript/TypeScript source files with extracted symbols, types, and locations.

**Contents:**
```json
{
  "modules": [
    {
      "path": "/_next/static/chunks/main-abc123.js",
      "size": 245000,
      "hash": "sha256:...",
      "symbols": [
        { "name": "SearchComponent", "kind": "class", "line": 42 }
      ],
      "types": [
        { "name": "SearchQuery", "kind": "interface", "properties": [...] }
      ]
    }
  ],
  "index": {
    "bySymbol": { "SearchComponent": ["main-abc123.js:42"] },
    "byType": { "SearchQuery": ["main-abc123.js:15"] }
  }
}
```

### 4. Compressed Specification (`perplexity_spa_full_spec.json.gz`)

**Size:** ~500 KB  
**Format:** Gzip-compressed JSON  
**Description:** Compressed version of full specification for efficient storage and transmission.

**Decompression:**
```bash
gunzip perplexity_spa_full_spec.json.gz
```

## Raw Data Files Inventory

### HAR Capture Files

**Location:** `./captures/har/`  
**Format:** HTTP Archive (HAR) v1.2  
**Description:** Complete HTTP transaction logs including headers, timings, request/response bodies.

**Example:**
```json
{
  "log": {
    "version": "1.2",
    "creator": { "name": "pplx-spa-assets-knowledge", "version": "1.0.0" },
    "entries": [
      {
        "startedDateTime": "2024-01-15T10:30:00.000Z",
        "request": { "method": "POST", "url": "https://www.perplexity.ai/api/search" },
        "response": { "status": 200, "content": {...} },
        "timings": { "send": 0, "wait": 120, "receive": 45 }
      }
    ]
  }
}
```

### WebSocket Message Logs

**Location:** `./captures/websocket/`  
**Format:** JSONL (JSON Lines)  
**Description:** Timestamped WebSocket messages with event types and payloads.

### Network Timing Data

**Location:** `./captures/timings/`  
**Format:** JSON  
**Description:** Performance metrics for each network request (DNS, TCP, SSL, TTFB, download).

### Source Maps and Bundles

**Location:** `./assets-cache/`  
**Format:** JavaScript, TypeScript, SourceMaps  
**Description:** Downloaded SPA bundles with corresponding source maps for debugging.

## Scripts & Tools Reference

### CLI Commands

#### 1. `browser` - Browser Automation

**Purpose:** Launch Chrome with DevTools Protocol for live API capture.

**Syntax:**
```bash
npm run browser -- [options]
# or
node dist/cli.js browser [options]
```

**Options:**
- `-p, --preset <preset>`: Capture preset (minimal, apiReversing, full, development)
- `-u, --url <url>`: Target URL (default: https://www.perplexity.ai)
- `-c, --chrome-port <port>`: CDP port (default: 9222)
- `--headless`: Run headless mode
- `-o, --output <dir>`: Output directory (default: ./captures)

**Example:**
```bash
node dist/cli.js browser \
  --preset apiReversing \
  --url https://www.perplexity.ai \
  --output ./my-captures
```

#### 2. `fetch` - Asset Fetcher

**Purpose:** Download SPA static assets from CDN with concurrent connections.

**Syntax:**
```bash
npm run fetch -- [options]
```

**Options:**
- `-s, --source <url>`: CDN URL (default: https://pplx-next-static-public.perplexity.ai)
- `-o, --output <dir>`: Cache directory (default: ./assets-cache)
- `-m, --manifest <path>`: Manifest file with asset paths
- `-c, --concurrency <num>`: Concurrent downloads (default: 3)
- `-t, --timeout <ms>`: Timeout in milliseconds (default: 30000)

**Example:**
```bash
npm run fetch -- \
  --source https://pplx-next-static-public.perplexity.ai \
  --manifest manifest.txt \
  --concurrency 5
```

#### 3. `analyze` - Local File Analysis

**Purpose:** Analyze local TypeScript/JavaScript files using AST parser.

**Syntax:**
```bash
npm run analyze -- [options]
```

**Options:**
- `-f, --file <path>`: Single file path
- `-d, --dir <path>`: Directory path
- `-p, --pattern <pattern>`: File pattern (default: *.{ts,js})
- `-o, --output <dir>`: Output directory (default: ./analysis-output)
- `-r, --recursive`: Recursive directory scan

**Example:**
```bash
npm run analyze -- \
  --dir ./src \
  --recursive \
  --pattern "*.{ts,tsx}" \
  --output ./analysis
```

#### 4. `parse` - TypeScript AST Parser

**Purpose:** Parse fetched assets and extract types, endpoints, and symbols.

**Syntax:**
```bash
npm run parse -- [options]
```

**Options:**
- `-i, --input <dir>`: Input directory (default: ./assets-cache)
- `-o, --output <dir>`: Output directory (default: ./parsed)

**Example:**
```bash
npm run parse -- --input ./assets-cache --output ./parsed
```

#### 5. `generate` - Specification Generator

**Purpose:** Generate OpenAPI, AsyncAPI, and JSON Schema specifications.

**Syntax:**
```bash
npm run generate -- [options]
```

**Options:**
- `-t, --type <type>`: Spec type (all, openapi, asyncapi, jsonschema)
- `-i, --input <dir>`: Input parsed data directory
- `-o, --output <dir>`: Output specs directory
- `--title <title>`: API title
- `--version <version>`: API version
- `--base-url <url>`: Base API URL

**Example:**
```bash
npm run generate -- \
  --type all \
  --title "Perplexity AI API" \
  --version 1.0.0 \
  --base-url https://api.perplexity.ai
```

#### 6. `mcp` - MCP Server Generator

**Purpose:** Generate complete MCP server from OpenAPI specification.

**Syntax:**
```bash
npm run mcp:generate -- [options]
```

**Options:**
- `--spec <path>`: OpenAPI spec path
- `--output <dir>`: Output directory
- `--name <name>`: Server name
- `--version <version>`: Server version
- `--author <author>`: Author name

**Example:**
```bash
npm run mcp:generate -- \
  --spec ./specs/openapi/api-v1.yaml \
  --output ./mcp/pplx-api \
  --name pplx-api \
  --version 0.1.0
```

#### 7. `kb` - Knowledge Base Builder

**Purpose:** Build structured knowledge base from parsed assets.

**Syntax:**
```bash
npm run kb:build -- [options]
```

**Options:**
- `-i, --input <dir>`: Input parsed directory
- `-o, --output <dir>`: Output KB directory

**Example:**
```bash
npm run kb:build -- --input ./parsed --output ./kb
```

## Usage Examples

### Python: Viewing Endpoints by Category

```python
import json
from collections import defaultdict

# Load endpoints specification
with open('perplexity_endpoints_spec.json', 'r') as f:
    spec = json.load(f)

# Group endpoints by tag/category
endpoints_by_category = defaultdict(list)

for path, methods in spec['paths'].items():
    for method, operation in methods.items():
        tags = operation.get('tags', ['uncategorized'])
        for tag in tags:
            endpoints_by_category[tag].append({
                'path': path,
                'method': method.upper(),
                'summary': operation.get('summary', ''),
                'operationId': operation.get('operationId', '')
            })

# Display endpoints by category
for category, endpoints in sorted(endpoints_by_category.items()):
    print(f"\n{category.upper()} ({len(endpoints)} endpoints)")
    print("=" * 60)
    for ep in endpoints:
        print(f"  {ep['method']:6} {ep['path']:40} {ep['summary']}")

# Example output:
# AUTHENTICATION (5 endpoints)
# ============================================================
#   POST   /api/auth/login                          User login
#   POST   /api/auth/logout                         User logout
#   GET    /api/auth/session                        Get session
```

### Python: Decoding Source Code from Base64+Gzip

```python
import json
import base64
import gzip

# Load source index
with open('perplexity_source_index.json', 'r') as f:
    index = json.load(f)

# Decode and decompress source code
def decode_source(encoded_content):
    """Decode base64 and decompress gzip-encoded source code."""
    decoded = base64.b64decode(encoded_content)
    decompressed = gzip.decompress(decoded)
    return decompressed.decode('utf-8')

# Example: Extract specific module
for module in index['modules']:
    if 'SearchComponent' in str(module.get('symbols', [])):
        print(f"Found in: {module['path']}")
        
        # If source is encoded
        if 'encodedContent' in module:
            source = decode_source(module['encodedContent'])
            print(source[:500])  # First 500 chars
```

### Node.js/TypeScript: Listing JavaScript Modules

```typescript
import { readFile } from 'fs/promises';

interface SourceIndex {
  modules: Array<{
    path: string;
    size: number;
    hash: string;
    symbols: Array<{ name: string; kind: string }>;
    types: Array<{ name: string; kind: string }>;
  }>;
  index: {
    bySymbol: Record<string, string[]>;
    byType: Record<string, string[]>;
  };
}

async function listModules() {
  const data = await readFile('perplexity_source_index.json', 'utf-8');
  const index: SourceIndex = JSON.parse(data);

  // Sort modules by size
  const sortedModules = index.modules
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  console.log('Top 10 Largest Modules:\n');
  console.log('Size       Path                              Symbols  Types');
  console.log('─'.repeat(80));

  for (const mod of sortedModules) {
    const sizeKB = (mod.size / 1024).toFixed(1);
    const symbolCount = mod.symbols?.length || 0;
    const typeCount = mod.types?.length || 0;
    
    console.log(
      `${sizeKB.padStart(7)} KB  ${mod.path.slice(0, 35).padEnd(35)}  ${String(symbolCount).padStart(7)}  ${typeCount}`
    );
  }
}

listModules();
```

### Node.js: Accessing Observed API Calls

```typescript
import { readFile } from 'fs/promises';

interface HAREntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: { mimeType: string; text: string };
  };
  response: {
    status: number;
    content: { mimeType: string; text?: string };
  };
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
}

async function analyzeAPICalls() {
  const harData = await readFile('./captures/har/session.har', 'utf-8');
  const har = JSON.parse(harData);

  // Filter API calls
  const apiCalls = har.log.entries.filter((entry: HAREntry) => 
    entry.request.url.includes('/api/')
  );

  // Group by endpoint
  const callsByEndpoint = new Map<string, HAREntry[]>();
  
  for (const call of apiCalls) {
    const url = new URL(call.request.url);
    const endpoint = `${call.request.method} ${url.pathname}`;
    
    if (!callsByEndpoint.has(endpoint)) {
      callsByEndpoint.set(endpoint, []);
    }
    callsByEndpoint.get(endpoint)!.push(call);
  }

  // Display statistics
  console.log('API Call Summary:\n');
  for (const [endpoint, calls] of callsByEndpoint) {
    const avgLatency = calls.reduce((sum, c) => 
      sum + c.timings.wait + c.timings.receive, 0
    ) / calls.length;
    
    console.log(`${endpoint}`);
    console.log(`  Calls: ${calls.length}`);
    console.log(`  Avg Latency: ${avgLatency.toFixed(1)}ms`);
    console.log('');
  }
}

analyzeAPICalls();
```

### TypeScript: Extracting React Hooks

```typescript
import { ParsedAsset, ExtractedType } from './src/types/index.js';
import { readFile } from 'fs/promises';

async function extractReactHooks() {
  const parsedData = await readFile('./parsed/parsed-result.json', 'utf-8');
  const assets: ParsedAsset[] = JSON.parse(parsedData);

  const hooks: Array<{ name: string; file: string; type: string }> = [];

  for (const asset of assets) {
    for (const symbol of asset.chunks.flatMap(c => c.symbols)) {
      // React hooks start with 'use'
      if (symbol.kind === 'function' && symbol.name.startsWith('use')) {
        hooks.push({
          name: symbol.name,
          file: symbol.location.file,
          type: 'custom-hook'
        });
      }
    }

    // Check for hook type definitions
    for (const type of asset.extractedTypes) {
      if (type.name.startsWith('Use') && type.name.endsWith('Hook')) {
        hooks.push({
          name: type.name,
          file: asset.metadata.url,
          type: 'hook-interface'
        });
      }
    }
  }

  console.log(`Found ${hooks.length} React hooks:\n`);
  hooks.forEach(hook => {
    console.log(`  ${hook.name} (${hook.type})`);
    console.log(`    in ${hook.file}\n`);
  });
}

extractReactHooks();
```

### Python: Using Generated Specifications with OpenAPI Generator

```python
import subprocess
import os

def generate_client_library(spec_path: str, language: str, output_dir: str):
    """Generate client library from OpenAPI spec using openapi-generator."""
    
    # Supported languages: python, typescript-axios, java, go, etc.
    cmd = [
        'openapi-generator-cli', 'generate',
        '-i', spec_path,
        '-g', language,
        '-o', output_dir,
        '--additional-properties=packageName=perplexity_client'
    ]
    
    print(f"Generating {language} client from {spec_path}...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ Client generated successfully in {output_dir}")
    else:
        print(f"❌ Generation failed: {result.stderr}")

# Example usage
generate_client_library(
    spec_path='./specs/openapi/api-v1.yaml',
    language='python',
    output_dir='./clients/python'
)

generate_client_library(
    spec_path='./specs/openapi/api-v1.yaml',
    language='typescript-axios',
    output_dir='./clients/typescript'
)
```

## Quick Reference Table

| File/Artifact | Description | Size | Format | Primary Usage |
|---------------|-------------|------|--------|---------------|
| `perplexity_spa_full_spec.json` | Complete SPA specification with all endpoints | ~1.9 MB | JSON | API documentation, testing |
| `perplexity_endpoints_spec.json` | REST endpoints only | ~37 KB | JSON | Client library generation |
| `perplexity_source_index.json` | Source code index with symbols | ~118 KB | JSON | Code navigation, search |
| `perplexity_spa_full_spec.json.gz` | Compressed full specification | ~500 KB | Gzip | Efficient storage/transfer |
| `session.har` | HTTP Archive with all requests | Variable | HAR 1.2 | Network analysis, replay |
| `websocket-messages.jsonl` | WebSocket message log | Variable | JSONL | Real-time events analysis |
| `api-v1.yaml` | OpenAPI v3.1 specification | ~150 KB | YAML | Swagger UI, Redoc, codegen |
| `events.yaml` | AsyncAPI v3.0 specification | ~50 KB | YAML | WebSocket documentation |
| `*.schema.json` | JSON Schema definitions | ~5-20 KB each | JSON | Data validation, types |
| `knowledge-base.json` | Structured knowledge entries | ~200 KB | JSON | GraphRAG, semantic search |
| `automcp.config.json` | automcp configuration | ~10 KB | JSON | MCP tool registration |
| `mcp/pplx-api/` | Generated MCP server | ~15 KB | TypeScript | Claude Desktop, Cline |

## Roadmap

### Phase 1: Asset Analysis and Spec Generation (Current)

**Status:** ✅ Complete

- [x] Asset fetching with retry logic
- [x] TypeScript AST parsing
- [x] OpenAPI v3.1 generation
- [x] AsyncAPI v3.0 generation
- [x] JSON Schema generation
- [x] MCP server generation
- [x] automcp configuration
- [x] Knowledge base builder
- [x] Browser automation with CDP

### Phase 2: GraphRAG Integration and Semantic Search (In Progress)

**Target:** Q2 2024

- [ ] Vector embeddings for knowledge entries
- [ ] Graph database integration (Neo4j, TypeDB)
- [ ] Semantic search over codebase
- [ ] Relationship extraction and mapping
- [ ] Natural language query interface
- [ ] Entity disambiguation and linking
- [ ] Knowledge graph visualization

### Phase 3: CI/CD Automation and Change Detection (Planned)

**Target:** Q3 2024

- [ ] GitHub Actions workflow for automated asset monitoring
- [ ] Scheduled spec regeneration (daily/weekly)
- [ ] API change detection and diffing
- [ ] Breaking change alerts
- [ ] Automated versioning (semver)
- [ ] Changelog generation
- [ ] Integration with API governance tools
- [ ] Notification system (Slack, Discord, email)

### Phase 4: Advanced Features (Future)

**Target:** Q4 2024 and beyond

- [ ] Visual API explorer web interface
- [ ] Interactive documentation portal
- [ ] GraphQL schema extraction
- [ ] gRPC/Protobuf support
- [ ] Multi-tenant API analysis
- [ ] Performance regression detection
- [ ] Security vulnerability scanning
- [ ] Rate limit and quota analysis
- [ ] Mock server generation
- [ ] SDK template generator

## Contributing

Contributions are welcome! Please see the main README.md for development setup instructions.

### Key Areas for Contribution

- **Type Extraction**: Improve detection of complex TypeScript patterns
- **Endpoint Discovery**: Add support for more API patterns (GraphQL, gRPC)
- **Generators**: Extend specification generators with additional features
- **Browser Automation**: Add more capture scenarios and presets
- **Knowledge Base**: Implement relationship extraction algorithms
- **Testing**: Increase test coverage for parsers and generators

## Resources

- **Project Repository**: https://github.com/pv-udpv/pplx-spa-assets-knowledge
- **Related Projects**: pplx-api-client, pplx-mcp-server
- **OpenAPI v3.1 Spec**: https://spec.openapis.org/oas/v3.1.0
- **AsyncAPI v3.0 Spec**: https://www.asyncapi.com/en/docs/specifications/v3.0.0
- **MCP Protocol**: https://modelcontextprotocol.io/
- **ts-morph Documentation**: https://ts-morph.com/
- **Perplexity AI**: https://www.perplexity.ai/

---

*Last Updated: 2024-01-15*  
*Version: 1.0.0*
