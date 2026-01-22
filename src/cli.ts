#!/usr/bin/env node
/**
 * CLI interface for asset parsing and spec generation
 */

import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
// Unused imports - reserved for future CLI commands
// import { writeFile, mkdir } from 'node:fs/promises';
// import { dirname, resolve } from 'node:path';
// import { parse as parseYaml } from 'yaml';
import { AssetFetcher } from './fetchers/asset-fetcher.js';
// import { TypeScriptASTParser } from './parsers/typescript-ast-parser.js';
// import { OpenAPIGenerator } from './generators/openapi-generator.js';
// import { AsyncAPIGenerator } from './generators/asyncapi-generator.js';
// import { JSONSchemaGenerator } from './generators/jsonschema-generator.js';
// import { AutoMCPGenerator, type MCPServerConfig } from './generators/automcp-generator.js';
// import { KnowledgeBaseBuilder } from './knowledge/kb-builder.js';
import { runBrowserSession } from './browser/browser-automation.js';
import { capturePresets } from './browser/capture-config.js';
// import type { OpenAPIV3_1 } from 'openapi-types';

const program = new Command();

program
  .name('pplx-assets')
  .description('Perplexity AI SPA assets analyzer and spec generator')
  .version('0.3.0');

/**
 * BROWSER command: Automate browser capture with CDP
 */
program
  .command('browser')
  .description('Launch browser automation with Chrome DevTools Protocol')
  .option('-p, --preset <preset>', 'Capture preset: minimal, apiReversing, full, development', 'apiReversing')
  .option('-u, --url <url>', 'URL to navigate to', 'https://www.perplexity.ai')
  .option('-c, --chrome-port <port>', 'Chrome DevTools Protocol port', '9222')
  .option('--headless', 'Run in headless mode', true)
  .option('-o, --output <dir>', 'Output directory for captures', './captures')
  .action(async (options) => {
    console.log('🌐 Browser Automation Pipeline');
    console.log('═'.repeat(60));

    try {
      let config = capturePresets[options.preset as keyof typeof capturePresets] || capturePresets.apiReversing;
      config.chrome.port = parseInt(options.chromePort);
      config.output.dir = options.output;
      config.headless = options.headless !== 'false';

      await runBrowserSession(config, async (browser) => {
        const cdp = browser.getCDPClient();

        // Navigate to URL
        await browser.executeTask('Navigate', async () => {
          await cdp.navigate(options.url, { waitUntil: 'networkidle2' });
        });

        // Wait for initial load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Execute search or other task
        await browser.executeTask('Execute Interaction', async () => {
          // User can extend this with custom logic
          console.log('   ⏳ Waiting for interactions...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        });
      });

      console.log('\n✅ Browser automation completed');
    } catch (error) {
      console.error('❌ Browser automation failed:', error);
      process.exit(1);
    }
  });

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

// ... (rest of CLI commands from previous version)

program.parse();

// Reserved for future automcp command
/*
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

function extractParametersForAutomcp(
  operation: OpenAPIV3_1.OperationObject
): Record<string, unknown>[] {
  const params: Record<string, unknown>[] = [];

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
*/
