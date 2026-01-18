# Examples

## Available Examples

### 1. `pipeline.sh` - Full Automation

Complete pipeline from fetching to MCP generation:

```bash
chmod +x examples/pipeline.sh
./examples/pipeline.sh
```

**What it does:**
1. Builds TypeScript
2. Fetches assets from CDN
3. Parses with AST
4. Generates OpenAPI/AsyncAPI/JSON Schema
5. Builds MCP server
6. Generates automcp config
7. Builds knowledge base

### 2. `manifest-generator.ts` - Extract Assets from HTML

Generate manifest.txt from HTML file:

```bash
npx ts-node examples/manifest-generator.ts index.html
```

**Extracts:**
- `<script src="...">`
- `<link href="...">`
- Import statements
- Next.js specific patterns

Outputs to `manifest.txt` for use with `pplx-assets fetch`.

## Custom Workflows

### Minimal Example: Single File Parsing

```bash
# Parse a single TypeScript file
node dist/cli.js parse --input path/to/file.ts --output ./parsed

# Generate specs
node dist/cli.js generate --input ./parsed --output ./specs
```

### Incremental Development

```bash
# Fetch once
npm run fetch

# Iteratively parse/generate while developing
npm run parse
npm run generate -- --type openapi

# Test MCP server
npm run mcp:generate
cd ./mcp/pplx-api && npm run dev
```

### Debug Mode

```bash
# Watch TypeScript compilation
npm run dev

# In another terminal, test commands
node dist/cli.js parse --input ./test-file.ts

# Check output
cat ./parsed/parsed-result.json | jq '.types | length'
```

## Integration Examples

### With GitHub Actions

See `.github/workflows/` for CI/CD examples.

### With Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "run", "fetch"]
```

### With Make

```makefile
.PHONY: fetch parse generate mcp kb all

all: fetch parse generate mcp kb

fetch:
	@npm run fetch

parse: fetch
	@npm run parse

generate: parse
	@npm run generate

mcp: generate
	@npm run mcp:generate

kb: parse
	@npm run kb:build

clean:
	rm -rf assets-cache parsed specs mcp kb
```

Usage:
```bash
make all      # Run entire pipeline
make fetch    # Just fetch
make clean    # Clean outputs
```
