#!/usr/bin/env node
/**
 * CLI interface for asset parsing and spec generation
 */

import { Command } from 'commander';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { AssetFetcher } from './fetchers/asset-fetcher.js';
import { TypeScriptASTParser } from './parsers/typescript-ast-parser.js';
import { OpenAPIGenerator } from './generators/openapi-generator.js';
import { AsyncAPIGenerator } from './generators/asyncapi-generator.js';
import { JSONSchemaGenerator } from './generators/jsonschema-generator.js';
import { AutoMCPGenerator, type MCPServerConfig } from './generators/automcp-generator.js';
import { KnowledgeBaseBuilder } from './knowledge/kb-builder.js';
import type { OpenAPIV3_1 } from 'openapi-types';

const program = new Command();

program
  .name('pplx-assets')
  .description('Perplexity AI SPA assets analyzer and spec generator')
  .version('0.2.0');

/**
 * FETCH command: Download SPA assets from CDN
 */
program
  .command('fetch')
  .description('Fetch SPA assets from pplx-next-static-public.perplexity.ai')
  .option(
    '-s, --source <url>',
    'Source CDN URL',
    'https://pplx-next-static-public.perplexity.ai'
  )
  .option('-o, --output <dir>', 'Output cache directory', './assets-cache')
  .option('-m, --manifest <path>', 'Optional manifest file with asset paths')
  .option('-c, --concurrency <num>', 'Concurrent downloads', '3')
  .option('-t, --timeout <ms>', 'Download timeout in ms', '30000')
  .action(async (options) => {
    console.log('🚀 Starting asset fetch from:', options.source);
    
    const fetcher = new AssetFetcher({
      baseUrl: options.source,
      cacheDir: options.output,
      timeout: parseInt(options.timeout),
      retries: 3,
      followRedirects: true,
    });

    try {
      // Get list of assets to fetch
      let assetPaths: string[] = [];
      
      if (options.manifest) {
        console.log('📋 Loading manifest from:', options.manifest);
        const manifestContent = await readFile(options.manifest, 'utf-8');
        assetPaths = manifestContent.split('\n').filter(l => l.trim());
      } else {
        console.log('📦 Fetching default asset manifest...');
        assetPaths = await fetcher.fetchManifest();
      }

      console.log(`📥 Downloading ${assetPaths.length} assets (concurrency: ${options.concurrency})...`);
      const assets = await fetcher.fetchAssets(assetPaths, parseInt(options.concurrency));

      // Save fetched assets
      console.log('💾 Saving assets to cache...');
      let savedCount = 0;
      for (const [path, buffer] of assets.entries()) {
        await fetcher.saveAsset(path, buffer);
        savedCount++;
        if (savedCount % 10 === 0) {
          console.log(`  Saved ${savedCount}/${assets.size}`);
        }
      }

      const progress = fetcher.getProgress();
      console.log('\n✅ Fetch complete:');
      console.log(`   Total: ${progress.total}`);
      console.log(`   Completed: ${progress.completed}`);
      console.log(`   Failed: ${progress.failed}`);
      console.log(`   Output: ${options.output}`);
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      process.exit(1);
    }
  });

/**
 * PARSE command: Parse TypeScript/JavaScript files with AST
 */
program
  .command('parse')
  .description('Parse TypeScript/JavaScript files and extract types, symbols, endpoints')
  .option('-i, --input <path>', 'Input file or directory', './assets-cache')
  .option('-o, --output <dir>', 'Output directory for parsed results', './parsed')
  .action(async (options) => {
    console.log('🔍 Parsing TypeScript/JavaScript files...');
    
    const parser = new TypeScriptASTParser();
    
    try {
      const inputPath = resolve(options.input);
      console.log(`📂 Input: ${inputPath}`);
      
      // Parse single file or implement directory traversal
      const result = parser.parseFile(inputPath);
      
      await mkdir(options.output, { recursive: true });
      
      await writeFile(
        `${options.output}/parsed-result.json`,
        JSON.stringify(result, null, 2),
        'utf-8'
      );
      
      console.log('✅ Parse complete:');
      console.log(`   Types extracted: ${result.types.length}`);
      console.log(`   Symbols found: ${result.symbols.length}`);
      console.log(`   Endpoints detected: ${result.endpoints.length}`);
      console.log(`   Output: ${options.output}`);
    } catch (error) {
      console.error('❌ Parse failed:', error);
      process.exit(1);
    }
  });

/**
 * GENERATE command: Generate OpenAPI/AsyncAPI/JSON Schema specs
 */
program
  .command('generate')
  .description('Generate OpenAPI/AsyncAPI/JSON Schema specifications')
  .option('-t, --type <type>', 'Spec type: openapi, asyncapi, jsonschema, or all', 'all')
  .option('-i, --input <dir>', 'Input directory with parsed assets', './parsed')
  .option('-o, --output <dir>', 'Output directory for specs', './specs')
  .option('--title <string>', 'API title', 'Perplexity AI API')
  .option('--version <string>', 'API version', '1.0.0')
  .option('--base-url <string>', 'Base URL for servers', 'https://www.perplexity.ai')
  .action(async (options) => {
    console.log('📝 Generating specifications...');
    
    try {
      const inputFile = `${options.input}/parsed-result.json`;
      const content = await readFile(inputFile, 'utf-8');
      const parsed = JSON.parse(content);
      
      const specConfig = {
        title: options.title,
        version: options.version,
        description: 'Perplexity AI reverse-engineered API specification',
        baseUrl: options.baseUrl,
        servers: [
          {
            url: options.baseUrl,
            description: 'Production',
          },
        ],
      };

      await mkdir(options.output, { recursive: true });

      const specs = ['openapi', 'asyncapi', 'jsonschema'];
      const typesToGenerate = options.type === 'all' ? specs : [options.type];

      // Validate spec types
      const validTypes = ['openapi', 'asyncapi', 'jsonschema', 'all'];
      if (!validTypes.includes(options.type)) {
        console.error(`❌ Invalid spec type: ${options.type}`);
        console.error(`   Valid types: ${validTypes.join(', ')}`);
        process.exit(1);
      }

      for (const specType of typesToGenerate) {
        switch (specType) {
          case 'openapi': {
            console.log('  Generating OpenAPI v3.1...');
            const openapiDir = `${options.output}/openapi`;
            await mkdir(openapiDir, { recursive: true });
            const openapiGen = new OpenAPIGenerator(specConfig);
            await openapiGen.generate(
              parsed.endpoints || [],
              `${openapiDir}/api-v1.yaml`
            );
            console.log('    ✓ OpenAPI generated');
            break;
          }
          case 'asyncapi': {
            console.log('  Generating AsyncAPI v3.0...');
            const asyncapiDir = `${options.output}/asyncapi`;
            await mkdir(asyncapiDir, { recursive: true });
            const asyncapiGen = new AsyncAPIGenerator(specConfig);
            await asyncapiGen.generate(
              parsed.endpoints || [],
              `${asyncapiDir}/events.yaml`
            );
            console.log('    ✓ AsyncAPI generated');
            break;
          }
          case 'jsonschema': {
            console.log('  Generating JSON Schemas...');
            const jsonschemaDir = `${options.output}/jsonschema`;
            await mkdir(jsonschemaDir, { recursive: true });
            const jsonschemaGen = new JSONSchemaGenerator();
            await jsonschemaGen.generate(
              parsed.types || [],
              `${jsonschemaDir}/models`
            );
            console.log('    ✓ JSON Schemas generated');
            break;
          }
          default:
            console.error(`❌ Unknown spec type: ${specType}`);
            process.exit(1);
        }
      }

      console.log('\n✅ Generation complete:');
      console.log(`   Output: ${options.output}`);
      console.log('   Specs generated: ' + typesToGenerate.join(', '));
    } catch (error) {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    }
  });

/**
 * KB command: Build knowledge base
 */
program
  .command('kb')
  .description('Build knowledge base from parsed assets')
  .option('-i, --input <dir>', 'Input directory with parsed assets', './parsed')
  .option('-o, --output <dir>', 'Output directory for KB', './kb')
  .action(async (options) => {
    console.log('🧠 Building knowledge base...');
    
    try {
      const inputFile = `${options.input}/parsed-result.json`;
      const content = await readFile(inputFile, 'utf-8');
      const parsed = JSON.parse(content);

      const builder = new KnowledgeBaseBuilder();
      const kb = await builder.build([parsed], options.output);

      console.log('✅ Knowledge base built:');
      console.log(`   Total entities: ${kb.statistics.totalEntities}`);
      console.log(`   Total types: ${kb.statistics.totalTypes}`);
      console.log(`   Total endpoints: ${kb.statistics.totalEndpoints}`);
      console.log(`   Output: ${options.output}`);
    } catch (error) {
      console.error('❌ KB build failed:', error);
      process.exit(1);
    }
  });

/**
 * MCP command: Generate MCP server from OpenAPI spec
 */
program
  .command('mcp')
  .description('Generate MCP server from OpenAPI specification')
  .option('-s, --spec <path>', 'OpenAPI spec file (YAML or JSON)', './specs/openapi/api-v1.yaml')
  .option('-o, --output <dir>', 'Output directory for MCP server', './mcp')
  .option('--name <string>', 'MCP server name', 'pplx-api')
  .option('--version <string>', 'MCP server version', '0.1.0')
  .option('--author <string>', 'MCP server author', 'pv-udpv')
  .option('--license <string>', 'MCP server license', 'MIT')
  .action(async (options) => {
    console.log('🛠️  Generating MCP server from OpenAPI spec...');
    
    try {
      // Read OpenAPI spec
      console.log(`📖 Reading spec from: ${options.spec}`);
      const specContent = await readFile(options.spec, 'utf-8');
      let openApiSpec: OpenAPIV3_1.Document;

      if (options.spec.endsWith('.yaml') || options.spec.endsWith('.yml')) {
        openApiSpec = parseYaml(specContent) as OpenAPIV3_1.Document;
      } else {
        openApiSpec = JSON.parse(specContent) as OpenAPIV3_1.Document;
      }

      // Generate MCP server
      const mcpConfig: MCPServerConfig = {
        name: options.name,
        version: options.version,
        description: openApiSpec.info.description || openApiSpec.info.title,
        author: options.author,
        license: options.license,
      };

      console.log('🔧 Generating MCP server structure...');
      const generator = new AutoMCPGenerator(mcpConfig);
      await generator.generate(openApiSpec, options.output);

      console.log('\n✅ MCP server generated:');
      console.log(`   Name: ${options.name}`);
      console.log(`   Version: ${options.version}`);
      console.log(`   Output: ${options.output}`);
      console.log('\n📋 Next steps:');
      console.log(`   1. cd ${options.output}`);
      console.log('   2. npm install');
      console.log('   3. npm run build');
      console.log('   4. Set environment variables in .env');
      console.log('   5. Run with: node dist/index.js');
    } catch (error) {
      console.error('❌ MCP generation failed:', error);
      process.exit(1);
    }
  });

/**
 * AUTOMCP command: Generate automcp configuration from OpenAPI
 */
program
  .command('automcp')
  .description('Generate automcp configuration from OpenAPI specification')
  .option('-s, --spec <path>', 'OpenAPI spec file (YAML or JSON)', './specs/openapi/api-v1.yaml')
  .option('-o, --output <path>', 'Output automcp config path', './automcp.config.json')
  .option('--api-key-env <var>', 'Environment variable for API key', 'API_KEY')
  .option('--base-url-env <var>', 'Environment variable for base URL', 'API_BASE_URL')
  .action(async (options) => {
    console.log('⚙️  Generating automcp configuration...');
    
    try {
      // Read OpenAPI spec
      console.log(`📖 Reading spec from: ${options.spec}`);
      const specContent = await readFile(options.spec, 'utf-8');
      let openApiSpec: OpenAPIV3_1.Document;

      if (options.spec.endsWith('.yaml') || options.spec.endsWith('.yml')) {
        openApiSpec = parseYaml(specContent) as OpenAPIV3_1.Document;
      } else {
        openApiSpec = JSON.parse(specContent) as OpenAPIV3_1.Document;
      }

      // Generate automcp config
      const automcpConfig = generateAutomcpConfig(
        openApiSpec,
        options.apiKeyEnv,
        options.baseUrlEnv
      );

      await mkdir(dirname(options.output), { recursive: true });
      await writeFile(options.output, JSON.stringify(automcpConfig, null, 2), 'utf-8');

      console.log('✅ automcp configuration generated:');
      console.log(`   Output: ${options.output}`);
      console.log('\n📋 Usage:');
      console.log('   export AUTOMCP_CONFIG=$(pwd)/automcp.config.json');
      console.log('   automcp run');
    } catch (error) {
      console.error('❌ automcp config generation failed:', error);
      process.exit(1);
    }
  });

program.parse();

/**
 * Generate automcp configuration object
 */
function generateAutomcpConfig(
  openApiSpec: OpenAPIV3_1.Document,
  apiKeyEnvVar: string,
  baseUrlEnvVar: string
): Record<string, unknown> {
  const tools = [];
  const baseUrl = process.env[baseUrlEnvVar] || openApiSpec.servers?.[0]?.url || 'https://api.example.com';

  for (const [path, pathItem] of Object.entries(openApiSpec.paths || {})) {
    if (!pathItem) continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === 'parameters' || method === 'servers') continue;

      const op = operation as OpenAPIV3_1.OperationObject;
      if (!op.operationId) continue;

      const tool = {
        name: op.operationId,
        description: op.description || op.summary || `${method.toUpperCase()} ${path}`,
        endpoint: path,
        method: method.toUpperCase(),
        parameters: extractParametersForAutomcp(op),
      };

      tools.push(tool);
    }
  }

  return {
    servers: [
      {
        name: 'production',
        url: baseUrl,
        apiKeyEnv: apiKeyEnvVar,
      },
    ],
    tools,
  };
}

/**
 * Extract parameters for automcp config
 */
function extractParametersForAutomcp(
  operation: OpenAPIV3_1.OperationObject
): Record<string, unknown>[] {
  const params: Record<string, unknown>[] = [];

  // Query and path parameters
  for (const param of operation.parameters || []) {
    if ('name' in param && 'schema' in param) {
      params.push({
        name: param.name,
        in: param.in,
        required: param.required || false,
        description: param.description,
        schema: param.schema,
      });
    }
  }

  // Request body
  if (operation.requestBody && 'content' in operation.requestBody) {
    const content = operation.requestBody.content['application/json'];
    if (content && 'schema' in content) {
      params.push({
        name: 'body',
        in: 'body',
        required: operation.requestBody.required || false,
        schema: content.schema,
      });
    }
  }

  return params;
}
