# pplx-spa-assets-knowledge

> Perplexity AI SPA static assets analyzer, knowledge base generator, and OpenAPI/AsyncAPI/JSON Schema specification builder

## Overview

This project systematically analyzes and documents Perplexity AI SPA assets from `pplx-next-static-public.perplexity.ai`, extracting structured knowledge and generating comprehensive API specifications.

## 📚 Documentation

- **[Knowledge Base](KNOWLEDGE_BASE.md)** - Complete catalog of all project artifacts, usage examples, and quick reference
- **[Architecture](ARCHITECTURE.md)** - System design, data flow, and technical details
- **[Development Instructions](.copilot-instructions.md)** - Setup and development workflow
- **[Browser Automation](BROWSER_AUTOMATION.md)** - Chrome DevTools Protocol integration
- **[Quick Start](QUICKSTART.md)** - Get started quickly

## Features

- **Asset Parser**: TypeScript-based chunking and analysis of SPA static assets
- **Knowledge Base Generator**: Automated extraction and structuring of domain knowledge
- **Specification Generators**:
  - OpenAPI v3 (REST API specs)
  - AsyncAPI v3 (WebSocket/event-driven specs)
  - JSON Schema (data model definitions)

## Architecture

```
src/
├── parsers/          # Asset parsing and chunking
│   └── asset-parser.ts
├── generators/       # Specification generators
│   ├── openapi-generator.ts
│   ├── asyncapi-generator.ts
│   └── jsonschema-generator.ts
├── knowledge/        # Knowledge base construction
│   └── kb-builder.ts
├── types/            # Type definitions
│   └── index.ts
└── cli.ts            # CLI interface
```

## Installation

```bash
# Using uv (recommended)
uv venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
uv pip install -e .

# Using npm
npm install
```

## Usage

### Analyze Local Files

Analyze TypeScript/JavaScript files that you have locally (uploaded or created):

```bash
# Analyze a single file
npm run analyze -- --file ./path/to/file.ts

# Analyze all files in a directory
npm run analyze -- --dir ./src

# Analyze directory recursively with custom pattern
npm run analyze -- --dir ./src --recursive --pattern "*.{ts,tsx}"

# Specify output directory
npm run analyze -- --dir ./src --output ./my-analysis
```

The analyze command will:
- Extract TypeScript types, interfaces, classes, and enums
- Identify symbols and their locations
- Detect API endpoints (fetch calls with HTTP methods)
- Generate a JSON report with the analysis results

### Parse Assets

```bash
npm run parse -- --source pplx-next-static-public.perplexity.ai --output ./assets-cache
```

### Generate Specifications

```bash
# Generate all specs
npm run generate

# Generate specific spec type
npm run generate -- --type openapi
npm run generate -- --type asyncapi
npm run generate -- --type jsonschema
```

### Build Knowledge Base

```bash
npm run kb:build -- --input ./assets-cache --output ./kb/generated
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

## Output Structure

```
specs/
├── openapi/
│   ├── api-v1.yaml
│   └── websocket.yaml
├── asyncapi/
│   ├── events.yaml
│   └── threads.yaml
└── jsonschema/
    ├── models/
    └── responses/

kb/
├── entities/
├── relationships/
└── documentation/
```

## Integration with Perplexity AI Ecosystem

This repository complements:
- [pplx-api-client](https://github.com/pv-udpv/pplx-api-client) - Unofficial Python/TypeScript clients
- [pplx-mcp-server](https://github.com/pv-udpv/pplx-mcp-server) - MCP server integration

## Roadmap

- [ ] Automated asset fetching and versioning
- [ ] GraphRAG integration for knowledge graph
- [ ] CI/CD pipeline for spec generation
- [ ] Semantic diff tracking for API changes
- [ ] Integration with MCP servers

## License

MIT
