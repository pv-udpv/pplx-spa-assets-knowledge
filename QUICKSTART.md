# Quick Start Guide

## Prerequisites

- Node.js 20+
- npm or yarn
- Basic TypeScript knowledge

## Installation

```bash
git clone https://github.com/pv-udpv/pplx-spa-assets-knowledge
cd pplx-spa-assets-knowledge
npm install
npm run build
```

## Full Pipeline Example

### Step 0: Analyze Local Files (New!)

If you have local TypeScript/JavaScript files you want to analyze (e.g., uploaded files, custom code), use the `analyze` command:

```bash
# Analyze a single file
npm run analyze -- --file ./my-code.ts --output ./analysis

# Analyze all TypeScript files in a directory
npm run analyze -- --dir ./src --output ./analysis

# Analyze recursively with custom pattern
npm run analyze -- \
  --dir ./src \
  --recursive \
  --pattern "*.{ts,tsx}" \
  --output ./analysis
```

**Output:**
```
./analysis/
└── analysis-results.json
    └── [
          {
            "file": "/path/to/file.ts",
            "types": [...],      # Interfaces, types, classes, enums
            "symbols": [...],    # Exported symbols with locations
            "endpoints": [...]   # Detected API endpoints
          }
        ]
```

**What Gets Analyzed:**
- TypeScript interfaces and types
- Classes with properties and methods
- Enums and their values
- API endpoints (fetch calls with HTTP methods)
- Symbols and their export status
- JSDoc comments and descriptions

### Step 1: Fetch SPA Assets

```bash
# Create manifest with asset paths
cat > manifest.txt << 'EOF'
/_next/static/chunks/main.js
/_next/static/chunks/webpack.js
/_next/static/chunks/pages/_app.js
EOF

# Fetch assets
npm run fetch -- \
  --source https://pplx-next-static-public.perplexity.ai \
  --manifest manifest.txt \
  --output ./assets-cache \
  --concurrency 5 \
  --timeout 30000
```

**Output Structure:**
```
./assets-cache/
├── _next/static/chunks/main.js
├── _next/static/chunks/webpack.js
└── _next/static/chunks/pages/_app.js
```

### Step 2: Parse TypeScript with AST

```bash
# Parse fetched assets
npm run parse -- \
  --input ./assets-cache \
  --output ./parsed
```

**Output:**
```
./parsed/
└── parsed-result.json
    ├── types: ExtractedType[]
    │   ├── name
    │   ├── kind (interface|type|class|enum)
    │   ├── properties
    │   └── methods
    ├── symbols: Symbol[]
    │   ├── name
    │   ├── kind (function|class|interface|type|const|enum)
    │   ├── exported
    │   └── location {file, line, column}
    └── endpoints: APIEndpoint[]
        ├── path
        ├── method (GET|POST|PUT|PATCH|DELETE|WS)
        ├── requestType
        └── responseType
```

### Step 3: Generate API Specifications

```bash
# Generate all specs (OpenAPI, AsyncAPI, JSON Schema)
npm run generate -- \
  --type all \
  --input ./parsed \
  --output ./specs \
  --title "Perplexity AI API" \
  --version 1.0.0 \
  --base-url https://api.perplexity.ai
```

**Output:**
```
./specs/
├── openapi/
│   └── api-v1.yaml           # OpenAPI v3.1 spec
├── asyncapi/
│   └── events.yaml           # AsyncAPI v3.0 spec (WebSocket)
└── jsonschema/
    └── models/
        ├── Query.schema.json
        ├── Response.schema.json
        └── ...
```

### Step 4: Generate MCP Server

```bash
# Generate MCP server from OpenAPI spec
npm run mcp:generate -- \
  --spec ./specs/openapi/api-v1.yaml \
  --output ./mcp/pplx-api \
  --name pplx-api \
  --version 0.1.0 \
  --author pv-udpv
```

**Generated MCP Server Structure:**
```
./mcp/pplx-api/
├── package.json              # MCP server dependencies
├── README.md                 # Documentation
├── .env.example              # Configuration template
├── tsconfig.json
└── src/
    ├── index.ts              # MCP server + tool registration
    ├── tools.ts              # Tool implementations with API calls
    └── types.ts              # Generated TypeScript types
```

**Configure & Run MCP Server:**
```bash
cd ./mcp/pplx-api
npm install
cp .env.example .env

# Edit .env with your API credentials
echo "API_BASE_URL=https://api.perplexity.ai" >> .env
echo "API_KEY=your-api-key-here" >> .env

# Build and run
npm run build
node dist/index.js
```

### Step 5: Generate automcp Configuration (Optional)

```bash
# Generate automcp config from OpenAPI spec
node dist/cli.js automcp \
  --spec ./specs/openapi/api-v1.yaml \
  --output ./automcp.config.json \
  --api-key-env API_KEY \
  --base-url-env API_BASE_URL
```

**Generated Config:**
```json
{
  "servers": [
    {
      "name": "production",
      "url": "https://api.perplexity.ai",
      "apiKeyEnv": "API_KEY"
    }
  ],
  "tools": [
    {
      "name": "search",
      "description": "Search for information",
      "endpoint": "/api/search",
      "method": "POST",
      "parameters": [...]
    }
  ]
}
```

**Use with automcp:**
```bash
export AUTOMCP_CONFIG=$(pwd)/automcp.config.json
automcp run
```

### Step 6: Build Knowledge Base (Optional)

```bash
npm run kb:build -- \
  --input ./parsed \
  --output ./kb
```

**Output:**
```
./kb/
├── knowledge-base.json
└── entities/
    ├── type_SearchQuery.json
    ├── type_Response.json
    ├── endpoint_GET_/api/search.json
    └── ...
```

## Integration with Claude / Cline

### Option 1: Using Generated MCP Server

Add to your `cline_mcp_config.json` or Claude settings:

```json
{
  "mcpServers": {
    "pplx-api": {
      "command": "node",
      "args": ["/path/to/mcp/pplx-api/dist/index.js"]
    }
  }
}
```

### Option 2: Using automcp

Add to your Claude config:

```bash
export AUTOMCP_CONFIG=/path/to/automcp.config.json
```

Then automcp will automatically expose tools to Claude.

## Typical Workflow

```bash
#!/bin/bash

# Full pipeline automation
echo "🚀 Starting Perplexity AI SPA analysis pipeline..."

# 1. Fetch
echo "📦 Fetching assets..."
npm run fetch -- --concurrency 5

# 2. Parse
echo "🔍 Parsing TypeScript..."
npm run parse

# 3. Generate
echo "📝 Generating specifications..."
npm run generate -- --type all

# 4. MCP
echo "🔧 Building MCP server..."
npm run mcp:generate

# 5. automcp
echo "⚙️  Generating automcp config..."
node dist/cli.js automcp

# 6. KB
echo "🧠 Building knowledge base..."
npm run kb:build

echo "✅ Pipeline complete!"
echo ""
echo "📍 Generated outputs:"
echo "   - OpenAPI: ./specs/openapi/api-v1.yaml"
echo "   - MCP Server: ./mcp/pplx-api/"
echo "   - automcp Config: ./automcp.config.json"
echo "   - Knowledge Base: ./kb/"
```

## Troubleshooting

### Asset Fetch Failures

```bash
# Check network connectivity
curl -I https://pplx-next-static-public.perplexity.ai/

# Try with longer timeout
npm run fetch -- --timeout 60000

# Check specific asset
echo "/_next/static/chunks/main.js" > single.txt
npm run fetch -- --manifest single.txt --concurrency 1
```

### Parse Errors

```bash
# Check TypeScript compilation
ls -lah ./assets-cache/

# Verify file is valid JavaScript/TypeScript
file ./assets-cache/_next/static/chunks/main.js

# Try parsing single file
node -e "const parser = require('./dist/parsers/typescript-ast-parser.js'); console.log(parser);"
```

### MCP Server Issues

```bash
cd ./mcp/pplx-api

# Check build
npm run build

# Test MCP server
node dist/index.js

# Check env vars
env | grep API
```

## Performance Tips

1. **Concurrency**: Start with 3-5, increase if no errors
2. **Timeout**: CDN sometimes slow, increase if timeouts occur
3. **Caching**: Assets are cached, rerun from `--input ./parsed`
4. **Memory**: For large bundles (>100MB), increase Node heap:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run parse
   ```

## Next Steps

1. **Extend Pattern Detection**: Add new API call patterns in `TypeScriptASTParser`
2. **Custom Tools**: Add post-processing in generators
3. **GraphRAG**: Integrate for knowledge graphs
4. **CI/CD**: Automate pipeline with GitHub Actions

## Resources

- [OpenAPI v3.1 Spec](https://spec.openapis.org/oas/v3.1.0)
- [AsyncAPI v3.0 Spec](https://www.asyncapi.com/en/docs/specifications/v3.0.0)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [ts-morph Docs](https://ts-morph.com/)
- [Perplexity AI](https://www.perplexity.ai/)
