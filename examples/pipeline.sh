#!/bin/bash

# Full Perplexity AI SPA Analysis Pipeline
# This script automates the entire process from asset fetching to MCP server generation

set -e

echo "🚀 Perplexity AI SPA Analysis Pipeline"
echo "======================================"
echo ""

# Configuration
SOURCE_URL="https://pplx-next-static-public.perplexity.ai"
CONCURRENCY=5
TIMEOUT=30000
API_TITLE="Perplexity AI API"
API_VERSION="1.0.0"
API_BASE_URL="https://api.perplexity.ai"
MCP_NAME="pplx-api"
MCP_VERSION="0.1.0"
MCP_AUTHOR="pv-udpv"

# Directories
ASSETS_DIR="./assets-cache"
PARSED_DIR="./parsed"
SPECS_DIR="./specs"
MCP_DIR="./mcp/pplx-api"
KB_DIR="./kb"
AUTOMCP_CONFIG="./automcp.config.json"

echo "📋 Configuration:"
echo "   Source: $SOURCE_URL"
echo "   Concurrency: $CONCURRENCY"
echo "   Output dirs: $ASSETS_DIR, $PARSED_DIR, $SPECS_DIR, $MCP_DIR, $KB_DIR"
echo ""

# Step 1: Build TypeScript
echo "1️⃣  Building TypeScript..."
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi
echo ""

# Step 2: Fetch Assets
echo "2️⃣  Fetching SPA assets..."
if [ -f "manifest.txt" ]; then
    echo "   📄 Using manifest.txt"
    npm run fetch -- \
        --source "$SOURCE_URL" \
        --output "$ASSETS_DIR" \
        --manifest manifest.txt \
        --concurrency "$CONCURRENCY" \
        --timeout "$TIMEOUT"
else
    echo "   📦 Using default asset paths"
    npm run fetch -- \
        --source "$SOURCE_URL" \
        --output "$ASSETS_DIR" \
        --concurrency "$CONCURRENCY" \
        --timeout "$TIMEOUT"
fi
echo ""

# Step 3: Parse Assets
echo "3️⃣  Parsing TypeScript with AST..."
npm run parse -- \
    --input "$ASSETS_DIR" \
    --output "$PARSED_DIR"
echo ""

# Step 4: Generate Specifications
echo "4️⃣  Generating specifications..."
echo "   📋 OpenAPI, AsyncAPI, JSON Schema"
npm run generate -- \
    --type all \
    --input "$PARSED_DIR" \
    --output "$SPECS_DIR" \
    --title "$API_TITLE" \
    --version "$API_VERSION" \
    --base-url "$API_BASE_URL"
echo ""

# Step 5: Generate MCP Server
echo "5️⃣  Generating MCP server..."
npm run mcp:generate -- \
    --spec "$SPECS_DIR/openapi/api-v1.yaml" \
    --output "$MCP_DIR" \
    --name "$MCP_NAME" \
    --version "$MCP_VERSION" \
    --author "$MCP_AUTHOR"
echo ""

# Step 6: Generate automcp Configuration
echo "6️⃣  Generating automcp configuration..."
node dist/cli.js automcp \
    --spec "$SPECS_DIR/openapi/api-v1.yaml" \
    --output "$AUTOMCP_CONFIG" \
    --api-key-env API_KEY \
    --base-url-env API_BASE_URL
echo ""

# Step 7: Build Knowledge Base
echo "7️⃣  Building knowledge base..."
npm run kb:build -- \
    --input "$PARSED_DIR" \
    --output "$KB_DIR"
echo ""

# Summary
echo "✅ Pipeline Complete!"
echo ""
echo "📁 Generated Files:"
echo "   Assets:     $ASSETS_DIR/"
echo "   Parsed:     $PARSED_DIR/"
echo "   Specs:      $SPECS_DIR/"
echo "   MCP:        $MCP_DIR/"
echo "   automcp:    $AUTOMCP_CONFIG"
echo "   KB:         $KB_DIR/"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "   1. Review generated specs:"
echo "      cat $SPECS_DIR/openapi/api-v1.yaml"
echo ""
echo "   2. Setup and run MCP server:"
echo "      cd $MCP_DIR"
echo "      npm install"
echo "      cp .env.example .env"
echo "      # Edit .env with your API credentials"
echo "      npm run build"
echo "      node dist/index.js"
echo ""
echo "   3. Use with automcp:"
echo "      export AUTOMCP_CONFIG=$(pwd)/$AUTOMCP_CONFIG"
echo "      automcp run"
echo ""
echo "   4. Use with Claude/Cline:"
echo "      Add MCP server to your Claude config"
echo ""
