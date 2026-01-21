# Architecture & Data Flow

## System Overview

```
┌───────────────────────────────────────────┐
│  Perplexity AI Static Assets (pplx-next-static-public.perplexity.ai)  │
└───────────────────────────────────────────┘
                            ↓
                      [AssetFetcher]
                    (concurrent HTTP/HTTPS)
                     (retry + backoff)
                            ↓
         ┌───────────────────────────────────────────┐
         │             assets-cache/                                      │
         │          (fetched bundles)                                    │
         └───────────────────────────────────────────┘
                            ↓
              [TypeScriptASTParser] (ts-morph)
                      (AST analysis)
                 (interfaces, types, classes,
                  enums, functions, JSDoc)
                            ↓
┌─────────────────────────────────────────────────────┐
│                         parsed/                                       │
│    ┤── parsed-result.json:                                       │
│    ├─ types: ExtractedType[]                                    │
│    ├─ symbols: Symbol[]                                        │
│    └─ endpoints: APIEndpoint[]                                  │
└─────────────────────────────────────────────────────┘
     ┌────────────┬────────────┬────────────┬────────────┐
     ↓          ↓            ↓          ↓            ↓          ↓
[OpenAPIGen] [AsyncAPIGen] [JSONSchemaGen] [KnowledgeBaseGen] [AutoMCPGen] [AutomcpGen]
     ↓          ↓            ↓          ↓            ↓          ↓
   specs/       specs/        specs/        kb/            mcp/      automcp.config.json
 openapi/      asyncapi/     jsonschema/   entities/     pplx-api/
api-v1.yaml   events.yaml   models/*.json kb.json      (full server)
```

## Data Flow

### 1. Asset Fetching

```
AssetFetcher
├─ fetchManifest() → string[] (asset paths)
├─ fetchAssets(paths[], concurrency)
│  ├─ downloadUrl(url) → Buffer
│  ├─ Retry logic (exponential backoff)
│  ├─ calculateHash(buffer) → sha256
│  └─ saveAsset(path, buffer) → filePath
└─ getProgress() → FetchProgress[]

{
  url: string
  status: 'pending' | 'downloading' | 'completed' | 'failed'
  size: number
  hash: string (sha256)
  error?: string
}
```

### 2. TypeScript AST Parsing

```
TypeScriptASTParser (ts-morph based)
├─ parseFile(filePath) → ParsedAsset
├─ parseContent(content, fileName) → ParsedAsset
└─ extractFromSourceFile(sourceFile)
   ├─ getInterfaces() → ExtractedType[]
   ├─ getTypeAliases() → ExtractedType[]
   ├─ getClasses() → ExtractedType[]
   ├─ getEnums() → ExtractedType[]
   ├─ getFunctions() → Symbol[], APIEndpoint[]
   └─ JSDoc extraction → description

 ExtractedType = {
   name: string
   kind: 'interface' | 'type' | 'class' | 'enum'
   properties: TypeProperty[]
   methods: TypeMethod[]
   extends: string[]
   implements: string[]
 }
```

### 3. Specification Generation

#### OpenAPI v3.1
```
OpenAPIGenerator
├─ Input: APIEndpoint[]
├─ buildSpec()
│  ├─ paths: PathsObject (from endpoints)
│  ├─ buildOperation() per endpoint
│  ├─ components.schemas (type references)
│  └─ security schemes
└─ Output: openapi.yaml (v3.1.0)
```

#### AsyncAPI v3.0
```
AsyncAPIGenerator
├─ Input: APIEndpoint[] (WS method)
├─ buildSpec()
│  ├─ channels: ChannelObject (from WS endpoints)
│  ├─ operations: send/receive per channel
│  └─ messages with payloads
└─ Output: asyncapi.yaml (v3.0.0)
```

#### JSON Schema
```
JSONSchemaGenerator
├─ Input: ExtractedType[]
├─ typeToSchema() per type
│  ├─ Extract properties
│  ├─ Map TypeScript types → JSON Schema
│  ├─ Mark required fields
│  └─ Generate $id and metadata
└─ Output: schemas/ (one file per type)
```

### 4. MCP Server Generation

```
AutoMCPGenerator
├─ Input: OpenAPIV3_1.Document
├─ MCPServerConfig { name, version, author, license }
├─ generate(spec, outputDir)
│  ├─ generatePackageJson()
│  ├─ generateServer() → src/index.ts
│  │  ├─ Server instantiation
│  │  ├─ ListToolsRequest handler
│  │  └─ CallToolRequest handler (switch on tool name)
│  ├─ generateTools() → src/tools.ts
│  │  ├─ callApi() helper (fetch wrapper)
│  │  └─ handle<OperationId>() per endpoint
│  ├─ generateTypes() → src/types.ts
│  ├─ generateReadme() → README.md
│  └─ generateEnvExample() → .env.example
└─ Output: mcp/pplx-api/ (complete Node.js MCP server)

 Tool = {
   name: string (operationId)
   description: string
   inputSchema: { type, properties, required }
 }
```

### 5. automcp Configuration

```
automcp Configuration
├─ servers[]
│  ├─ name: string
│  ├─ url: string (API_BASE_URL)
│  └─ apiKeyEnv: string (e.g., API_KEY)
└─ tools[]
   ├─ name: string (operationId)
   ├─ description: string
   ├─ endpoint: string (path)
   ├─ method: string (HTTP method)
   └─ parameters[]
      ├─ name: string
      ├─ in: 'path' | 'query' | 'body'
      ├─ required: boolean
      └─ schema: JSONSchema
```

### 6. Knowledge Base Construction

```
KnowledgeBaseBuilder
├─ Input: ParsedAsset[]
├─ build(assets, outputDir)
│  ├─ processAsset() per asset
│  │  ├─ Create entity for each type
│  │  ├─ Create entity for each endpoint
│  │  └─ Extract relationships (TODO)
│  └─ saveKnowledgeBase()
┃     ├─ knowledge-base.json (metadata)
┃     └─ entities/ (individual entity files)
└─ Output: kb/

 KnowledgeBaseEntry = {
   id: string
   type: 'entity' | 'relationship' | 'concept'
   content: string (JSON-serialized)
   metadata: { source, kind, ... }
   references: string[] (related IDs)
 }
```

## Type System

### Core Types

```typescript
// Asset level
AssetMetadata {
  url: string
  hash: string (sha256)
  size: number
  contentType: string
  fetchedAt: Date
}

ParsedAsset {
  metadata: AssetMetadata
  chunks: AssetChunk[]
  extractedTypes: ExtractedType[]
  apiEndpoints: APIEndpoint[]
}

// Code level
AssetChunk {
  id: string
  type: 'javascript' | 'typescript' | 'json' | 'css' | 'html'
  content: string
  startLine: number
  endLine: number
  symbols: Symbol[]
}

Symbol {
  name: string
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum'
  exported: boolean
  location: { file, line, column }
}

// Type level
ExtractedType {
  name: string
  kind: 'interface' | 'type' | 'class' | 'enum'
  properties: TypeProperty[]
  methods: TypeMethod[]
  extends: string[]
  implements: string[]
}

TypeProperty {
  name: string
  type: string
  optional: boolean
  readonly: boolean
  description?: string (from JSDoc)
}

TypeMethod {
  name: string
  parameters: MethodParameter[]
  returnType: string
  async: boolean
}

// API level
APIEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS'
  requestType?: string (reference to type)
  responseType?: string (reference to type)
  description?: string
}
```

## CLI Command Flow

```
pplx-assets
├─ fetch
│  ├─ Options: --source, --output, --manifest, --concurrency, --timeout
│  ├─ Creates: AssetFetcher
│  ├─ Process: downloadWithRetry → saveAsset
│  └─ Output: assets-cache/
├─ parse
│  ├─ Options: --input, --output
│  ├─ Creates: TypeScriptASTParser
│  ├─ Process: parseFile → extractFromSourceFile
│  └─ Output: parsed/parsed-result.json
├─ generate
│  ├─ Options: --type [all|openapi|asyncapi|jsonschema], --input, --output, --title, --version
│  ├─ Creates: OpenAPIGenerator, AsyncAPIGenerator, JSONSchemaGenerator
│  ├─ Process: build → generate
│  └─ Output: specs/{openapi,asyncapi,jsonschema}/
├─ mcp
│  ├─ Options: --spec, --output, --name, --version, --author
│  ├─ Creates: AutoMCPGenerator
│  ├─ Process: generate (all files)
│  └─ Output: mcp/<name>/
├─ automcp
│  ├─ Options: --spec, --output, --api-key-env, --base-url-env
│  ├─ Process: generateAutomcpConfig
│  └─ Output: automcp.config.json
├─ kb
│  ├─ Options: --input, --output
│  ├─ Creates: KnowledgeBaseBuilder
│  ├─ Process: build → saveKnowledgeBase
│  └─ Output: kb/
└─ (combined in pipeline.sh)
```

## Performance Characteristics

### Fetching
- **Concurrency**: 3-5 concurrent downloads (configurable)
- **Backoff**: 1s, 2s, 4s, 8s, 16s (exponential)
- **Throughput**: ~10-50 files/sec depending on network
- **Memory**: O(file_size) per concurrent download

### Parsing
- **Time**: ~1-5s per 1MB bundle (ts-morph AST parsing)
- **Memory**: ~200-300MB for 10MB bundle
- **Bottleneck**: ts-morph type inference

### Spec Generation
- **Time**: ~100ms for complete spec generation
- **Memory**: ~50MB for 1000 types
- **Output**: Minimal (specs are text)

### MCP Generation
- **Time**: ~50ms to generate full server
- **Output**: ~15KB (complete server code)

## Error Handling

```
AssetFetcher
├─ Network errors: Retry with backoff
├─ Timeout: Configurable timeout, abort
├─ HTTP 4xx/5xx: Record failure, continue
└─ Disk write: Fail immediately

TypeScriptASTParser
├─ Parse errors: Log and skip file
├─ AST extraction: Graceful degradation
└─ Type inference: Default to 'unknown'

Generators
├─ Invalid OpenAPI: Error and exit
├─ Missing fields: Skip or use defaults
└─ Write errors: Fail immediately
```

## Security Considerations

1. **Asset Validation**
   - SHA256 hash verification (optional)
   - Content-Type validation

2. **API Credentials**
   - Use environment variables (.env)
   - Never hardcode API keys
   - Support secrets management (Infisical, SOPS)

3. **Code Generation**
   - Generated code is untrusted (from dynamic spec)
   - MCP server should validate all inputs
   - Sanitize environment variable usage

4. **Third-party Libraries**
   - ts-morph: Code analysis only (no execution)
   - @modelcontextprotocol/sdk: Protocol implementation
   - Limited external dependencies

## Future Enhancements

1. **Caching Layer**
   - Cache parsed ASTs
   - Incremental parsing for large bundles

2. **Distributed Processing**
   - Worker threads for parallel parsing
   - Queue-based asset processing

3. **Knowledge Graphs**
   - GraphRAG integration
   - Relationship extraction
   - Semantic search

4. **Continuous Integration**
   - Automated asset monitoring
   - Spec versioning
   - Change detection

5. **Advanced Type Analysis**
   - Recursive type resolution
   - Generic type inference
   - Union/intersection handling
