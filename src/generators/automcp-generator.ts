/**
 * AutoMCP MCP server generator from OpenAPI schemas
 * Generates MCP server implementations using automcp patterns
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { OpenAPIV3_1 } from 'openapi-types';

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: string;
}

export class AutoMCPGenerator {
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  /**
   * Generate complete MCP server from OpenAPI schema
   */
  async generate(
    openApiSpec: OpenAPIV3_1.Document,
    outputDir: string
  ): Promise<void> {
    await mkdir(outputDir, { recursive: true });

    // Generate package.json
    await this.generatePackageJson(outputDir);

    // Generate main server file
    await this.generateServer(openApiSpec, outputDir);

    // Generate tool implementations
    await this.generateTools(openApiSpec, outputDir);

    // Generate types file
    await this.generateTypes(openApiSpec, outputDir);

    // Generate README
    await this.generateReadme(openApiSpec, outputDir);

    // Generate .env.example
    await this.generateEnvExample(outputDir);
  }

  private async generatePackageJson(outputDir: string): Promise<void> {
    const packageJson = {
      name: `mcp-${this.config.name}`,
      version: this.config.version,
      description: this.config.description,
      type: 'module',
      main: 'dist/index.js',
      author: this.config.author,
      license: this.config.license,
      scripts: {
        build: 'tsc',
        dev: 'tsc --watch',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.25.2',
      },
      devDependencies: {
        '@types/node': '^22.10.5',
        typescript: '^5.7.3',
      },
      engines: {
        node: '>=20.0.0',
      },
    };

    await writeFile(
      join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );
  }

  private async generateServer(
    openApiSpec: OpenAPIV3_1.Document,
    outputDir: string
  ): Promise<void> {
    const srcDir = join(outputDir, 'src');
    await mkdir(srcDir, { recursive: true });

    const tools = this.extractTools(openApiSpec);

    const serverCode = `/**
 * MCP Server: ${this.config.name}
 * Generated from OpenAPI spec: ${openApiSpec.info.title}
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: '${this.config.name}',
  version: '${this.config.version}',
});

// Tool handlers
import { ${tools.map(t => t.handlerName).join(', ')} } from './tools.js';

const TOOLS: Tool[] = [
${tools
  .map(
    t => `  {
    name: '${t.name}',
    description: '${t.description}',
    inputSchema: ${JSON.stringify(t.inputSchema, null, 4).split('\n').join('\n    ')},
  }`
  )
  .join(',\n')}
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
${tools
  .map(
    t => `    case '${t.name}':
      return ${t.handlerName}(request.params.arguments);`
  )
  .join('\n')}
    default:
      throw new Error('Unknown tool');
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
`;

    await writeFile(join(srcDir, 'index.ts'), serverCode, 'utf-8');
  }

  private async generateTools(
    openApiSpec: OpenAPIV3_1.Document,
    outputDir: string
  ): Promise<void> {
    const srcDir = join(outputDir, 'src');
    const tools = this.extractTools(openApiSpec);

    const toolsCode = `/**
 * Tool implementations for ${this.config.name}
 * Auto-generated from OpenAPI spec
 */

export async function callApi<T = unknown>(
  path: string,
  method: string,
  body?: unknown
): Promise<T> {
  const baseUrl = process.env.API_BASE_URL || '${(openApiSpec.servers?.[0]?.url) || 'http://localhost:3000'}';
  const url = \`\${baseUrl}\${path}\`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.API_KEY && { Authorization: \`Bearer \${process.env.API_KEY}\` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(\`API error: \${response.statusText}\`);
  }

  return response.json();
}

${tools
  .map(
    t => `
/**
 * Tool: ${t.name}
 * ${t.description}
 */
export async function ${t.handlerName}(args: ${t.typeName}): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // TODO: Implement tool logic
    // Pattern: POST /api/endpoint
    const result = await callApi('${t.path}', '${t.method}', args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: \`Error: \${error instanceof Error ? error.message : String(error)}\`,
        },
      ],
    };
  }
}
`
  )
  .join('\n')}
`;

    await writeFile(join(srcDir, 'tools.ts'), toolsCode, 'utf-8');
  }

  private async generateTypes(
    openApiSpec: OpenAPIV3_1.Document,
    outputDir: string
  ): Promise<void> {
    const srcDir = join(outputDir, 'src');
    const schemas = openApiSpec.components?.schemas || {};

    let typesCode = '/**\n * Generated types from OpenAPI spec\n */\n\n';

    for (const [name, schema] of Object.entries(schemas)) {
      if (schema && typeof schema === 'object' && 'properties' in schema) {
        typesCode += `export interface ${name} {\n`;
        const props = schema.properties as Record<string, unknown>;
        for (const propName of Object.keys(props)) {
          const required = Array.isArray(schema.required) && schema.required.includes(propName);
          typesCode += `  ${propName}${required ? '' : '?'}: unknown; // TODO: Extract type\n`;
        }
        typesCode += '}\n\n';
      }
    }

    await writeFile(join(srcDir, 'types.ts'), typesCode, 'utf-8');
  }

  private async generateReadme(
    openApiSpec: OpenAPIV3_1.Document,
    outputDir: string
  ): Promise<void> {
    const tools = this.extractTools(openApiSpec);

    const readme = `# ${this.config.name}

> ${this.config.description}

## Overview

MCP Server for ${openApiSpec.info.title} v${openApiSpec.info.version}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Configuration

Set environment variables:

\`\`\`bash
API_BASE_URL=https://api.example.com
API_KEY=your-api-key
\`\`\`

## Available Tools

${tools
  .map(
    t => `
### ${t.name}

${t.description}

**Endpoint:** \`${t.method} ${t.path}\`
`
  )
  .join('\n')}

## Usage with Claude

Add to your Claude config:

\`\`\`json
{
  "name": "${this.config.name}",
  "command": "node",
  "args": ["dist/index.js"]
}
\`\`\`

## Generated from

- Title: ${openApiSpec.info.title}
- Version: ${openApiSpec.info.version}
- Generated at: ${new Date().toISOString()}
`;

    await writeFile(join(outputDir, 'README.md'), readme, 'utf-8');
  }

  private async generateEnvExample(outputDir: string): Promise<void> {
    const envExample = `# API Configuration
API_BASE_URL=https://api.perplexity.ai
API_KEY=your-api-key-here

# MCP Server Configuration
MCP_PORT=3000
`;

    await writeFile(join(outputDir, '.env.example'), envExample, 'utf-8');
  }

  private extractTools(
    openApiSpec: OpenAPIV3_1.Document
  ): Array<{
    name: string;
    description: string;
    path: string;
    method: string;
    inputSchema: Record<string, unknown>;
    handlerName: string;
    typeName: string;
  }> {
    const tools = [];

    for (const [path, pathItem] of Object.entries(openApiSpec.paths || {})) {
      if (!pathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (method === 'parameters' || method === 'servers') continue;

        const op = operation as OpenAPIV3_1.OperationObject;
        if (!op.operationId) continue;

        const handlerName = `handle${op.operationId.charAt(0).toUpperCase()}${op.operationId.slice(1)}`;
        const typeName = `${op.operationId.charAt(0).toUpperCase()}${op.operationId.slice(1)}Args`;

        tools.push({
          name: op.operationId,
          description: op.description || op.summary || `${method.toUpperCase()} ${path}`,
          path,
          method: method.toUpperCase(),
          inputSchema: this.buildInputSchema(op),
          handlerName,
          typeName,
        });
      }
    }

    return tools;
  }

  private buildInputSchema(
    operation: OpenAPIV3_1.OperationObject
  ): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    // Parameters (query, path, header)
    for (const param of operation.parameters || []) {
      if ('name' in param && 'schema' in param) {
        properties[param.name] = param.schema || { type: 'string' };
        if (param.required) required.push(param.name);
      }
    }

    // Request body
    if (operation.requestBody && 'content' in operation.requestBody) {
      const content = operation.requestBody.content['application/json'];
      if (content && 'schema' in content) {
        Object.assign(properties, (content.schema as Record<string, unknown>).properties || {});
        if (Array.isArray((content.schema as Record<string, unknown>).required)) {
          required.push(...((content.schema as Record<string, unknown>).required as string[]));
        }
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }
}
