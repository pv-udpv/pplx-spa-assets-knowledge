#!/usr/bin/env node
/**
 * CLI interface for asset parsing and spec generation
 */

import { Command } from 'commander';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { AssetFetcher } from './fetchers/asset-fetcher.js';
import { TypeScriptASTParser } from './parsers/typescript-ast-parser.js';
// Disabled due to build errors - will be re-enabled when browser commands are needed
// import { runBrowserSession } from './browser/browser-automation.js';
// import { capturePresets } from './browser/capture-config.js';

// The following imports are reserved for future CLI commands that are not yet fully implemented:
// - OpenAPIGenerator, AsyncAPIGenerator, JSONSchemaGenerator for generate command
// - AutoMCPGenerator for MCP generation
// - KnowledgeBaseBuilder for knowledge base construction
// - RequestReplayer, SessionStateManager, AntiBotAnalyzer for browser automation commands

const program = new Command();

program
  .name('pplx-assets')
  .description('Perplexity AI SPA assets analyzer and spec generator')
  .version('0.3.0');

/**
 * BROWSER command: Automate browser capture with CDP
 * NOTE: Temporarily disabled due to missing chrome-remote-interface dependency
 */
/*
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
*/

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

/**
 * ANALYZE command: Analyze local files using TypeScript AST parser
 */
program
  .command('analyze')
  .description('Analyze local TypeScript/JavaScript files')
  .option('-f, --file <path>', 'Single file to analyze')
  .option('-d, --dir <path>', 'Directory to analyze')
  .option('-p, --pattern <pattern>', 'File pattern (e.g., "*.ts", "*.js")', '*.{ts,js}')
  .option('-o, --output <dir>', 'Output directory for analysis results', './analysis-output')
  .option('-r, --recursive', 'Recursively analyze directories', false)
  .action(async (options) => {
    console.log('🔍 Analyzing local files...');
    console.log('═'.repeat(60));

    try {
      const parser = new TypeScriptASTParser();
      const filesToAnalyze: string[] = [];

      // Collect files to analyze
      if (options.file) {
        console.log(`📄 Single file mode: ${options.file}`);
        const filePath = resolve(options.file);
        filesToAnalyze.push(filePath);
      } else if (options.dir) {
        console.log(`📁 Directory mode: ${options.dir}`);
        const dirPath = resolve(options.dir);
        const files = await collectFiles(dirPath, options.pattern, options.recursive);
        filesToAnalyze.push(...files);
        console.log(`   Found ${files.length} file(s)`);
      } else {
        console.error('❌ Error: Please specify either --file or --dir');
        process.exit(1);
      }

      if (filesToAnalyze.length === 0) {
        console.log('⚠️  No files found to analyze');
        return;
      }

      // Analyze each file
      const results = [];
      let failedFiles = 0;
      
      for (const filePath of filesToAnalyze) {
        console.log(`\n📝 Analyzing: ${filePath}`);
        try {
          const content = await readFile(filePath, 'utf-8');
          const analysis = parser.parseContent(content, filePath);
          
          results.push({
            file: filePath,
            types: analysis.types,
            symbols: analysis.symbols,
            endpoints: analysis.endpoints,
          });

          console.log(`   ✓ Types: ${analysis.types.length}`);
          console.log(`   ✓ Symbols: ${analysis.symbols.length}`);
          console.log(`   ✓ Endpoints: ${analysis.endpoints.length}`);
          
          // Clean up the source file to prevent memory accumulation
          try {
            const project = (parser as any).project;
            const sourceFile = project.getSourceFile(filePath);
            if (sourceFile) {
              project.removeSourceFile(sourceFile);
            }
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        } catch (error) {
          failedFiles++;
          console.error(`   ✗ Failed to analyze: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Save results
      await mkdir(options.output, { recursive: true });
      const outputPath = join(options.output, 'analysis-results.json');
      await writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      console.log('\n✅ Analysis complete:');
      console.log(`   Files attempted: ${filesToAnalyze.length}`);
      console.log(`   Files analyzed: ${results.length}`);
      if (failedFiles > 0) {
        console.log(`   Files failed: ${failedFiles}`);
      }
      console.log(`   Total types: ${results.reduce((sum, r) => sum + r.types.length, 0)}`);
      console.log(`   Total symbols: ${results.reduce((sum, r) => sum + r.symbols.length, 0)}`);
      console.log(`   Total endpoints: ${results.reduce((sum, r) => sum + r.endpoints.length, 0)}`);
      console.log(`   Output: ${outputPath}`);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

/**
 * REPLAY command: Replay requests from HAR file
 */
program
  .command('replay')
  .description('Replay HTTP requests from HAR file')
  .requiredOption('--har <file>', 'HAR file to replay')
  .option('-f, --filter <pattern>', 'URL pattern to filter (e.g., "api.example.com")')
  .option('-d, --delay <ms>', 'Delay between requests in milliseconds', '0')
  .option('-o, --output <file>', 'Output file for results', './replay-results.json')
  .action(async (options) => {
    console.log('🔄 Request Replay');
    console.log('═'.repeat(60));
    console.log(`   HAR file: ${options.har}`);
    console.log(`   Filter: ${options.filter || 'none'}`);
    console.log(`   Delay: ${options.delay}ms`);

    console.log('\n⚠️  Note: Request replay requires browser automation to be enabled');
    console.log('   This feature will be available when the browser command is active');
    console.log('   For now, use the Python helper script, for example:');
    console.log('     python3 scripts/har_to_openapi.py --har path/to/requests.har --output path/to/openapi.json');
  });

/**
 * DIFF command: Diff browser state snapshots
 */
program
  .command('diff')
  .description('Compare two browser state snapshots')
  .requiredOption('--before <file>', 'Before snapshot file')
  .requiredOption('--after <file>', 'After snapshot file')
  .option('-o, --output <file>', 'Output file for diff results', './snapshot-diff.json')
  .action(async (options) => {
    console.log('🔍 Snapshot Diff');
    console.log('═'.repeat(60));
    console.log(`   Before: ${options.before}`);
    console.log(`   After: ${options.after}`);

    try {
      // Load snapshots with validation
      let before, after;
      
      try {
        const beforeContent = await readFile(options.before, 'utf-8');
        before = JSON.parse(beforeContent);
      } catch (error) {
        throw new Error(`Failed to parse before snapshot: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        const afterContent = await readFile(options.after, 'utf-8');
        after = JSON.parse(afterContent);
      } catch (error) {
        throw new Error(`Failed to parse after snapshot: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Simple diff
      const diff = {
        timestamp: new Date().toISOString(),
        before: options.before,
        after: options.after,
        changes: {
          localStorage: compareSets(before.localStorage || {}, after.localStorage || {}),
          sessionStorage: compareSets(before.sessionStorage || {}, after.sessionStorage || {}),
          cookies: compareSets(before.cookies || [], after.cookies || []),
          url: {
            changed: before.url !== after.url,
            before: before.url,
            after: after.url,
          },
        },
      };

      // Save diff
      await writeFile(options.output, JSON.stringify(diff, null, 2), 'utf-8');

      console.log('\n✅ Diff completed');
      console.log(`   Output: ${options.output}`);
    } catch (error) {
      console.error('❌ Diff failed:', error);
      process.exit(1);
    }
  });

/**
 * ANTIBOT command: Analyze anti-bot protection
 */
program
  .command('antibot')
  .description('Analyze website for anti-bot protection mechanisms')
  .option('-u, --url <url>', 'URL to analyze (requires browser automation)')
  .option('-o, --output <file>', 'Output file for analysis results', './antibot-analysis.json')
  .action(async (_options) => {
    console.log('🔍 Anti-Bot Protection Analysis');
    console.log('═'.repeat(60));

    console.log('\n⚠️  Note: Anti-bot analysis requires browser automation to be enabled');
    console.log('   This feature will be available when the browser command is active');
    console.log('   For now, manually check for:');
    console.log('   - Cloudflare protection');
    console.log('   - reCAPTCHA / hCAPTCHA');
    console.log('   - Canvas fingerprinting');
    console.log('   - WebRTC fingerprinting');
    console.log('   - WebDriver detection');
  });

// ... (rest of CLI commands from previous version)

program.parse();

/**
 * Helper to compare two objects/arrays and find differences
 */
function compareSets(before: any, after: any): { added: any[]; removed: any[]; modified: any[] } {
  const result: { added: any[]; removed: any[]; modified: any[] } = { added: [], removed: [], modified: [] };
  
  if (Array.isArray(before) && Array.isArray(after)) {
    // Array comparison with value-based equality using JSON.stringify
    result.added = after.filter((item: any) =>
      !before.some((other: any) => JSON.stringify(other) === JSON.stringify(item))
    );
    result.removed = before.filter((item: any) =>
      !after.some((other: any) => JSON.stringify(other) === JSON.stringify(item))
    );
  } else if (typeof before === 'object' && typeof after === 'object') {
    // Object comparison
    const beforeKeys = new Set(Object.keys(before));
    const afterKeys = new Set(Object.keys(after));
    
    for (const key of afterKeys) {
      if (!beforeKeys.has(key)) {
        result.added.push({ key, value: after[key] });
      } else if (before[key] !== after[key]) {
        result.modified.push({ key, before: before[key], after: after[key] });
      }
    }
    
    for (const key of beforeKeys) {
      if (!afterKeys.has(key)) {
        result.removed.push({ key, value: before[key] });
      }
    }
  }
  
  return result;
}

/**
 * Helper function to collect files from a directory
 */
async function collectFiles(
  dirPath: string,
  pattern: string,
  recursive: boolean
): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory() && recursive) {
        const subFiles = await collectFiles(fullPath, pattern, recursive);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Simple pattern matching for *.ts, *.js, etc.
        const matchesPattern = matchFilePattern(entry.name, pattern);
        
        if (matchesPattern) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

/**
 * Simple glob pattern matcher
 * Note: For production use, consider using a library like 'minimatch' for full glob support
 */
function matchFilePattern(filename: string, pattern: string): boolean {
  // Match all files
  if (pattern === '*') {
    return true;
  }
  
  // Handle patterns like *.{ts,js}
  if (pattern.includes('{') && pattern.includes('}')) {
    const openBraceIndex = pattern.indexOf('{');
    const closeBraceIndex = pattern.indexOf('}');
    
    // Validate brace structure
    if (closeBraceIndex <= openBraceIndex + 1) {
      console.warn(`Invalid pattern: ${pattern}. Braces must contain content.`);
      return false;
    }
    
    const basePattern = pattern.substring(0, openBraceIndex);
    const extensionsStr = pattern.substring(openBraceIndex + 1, closeBraceIndex);
    
    // Check for empty extensions
    if (!extensionsStr.trim()) {
      console.warn(`Invalid pattern: ${pattern}. Empty extensions in braces.`);
      return false;
    }
    
    const extensions = extensionsStr.split(',');
    
    for (const ext of extensions) {
      const fullPattern = basePattern + ext.trim();
      if (matchSimplePattern(filename, fullPattern)) {
        return true;
      }
    }
    return false;
  }
  
  return matchSimplePattern(filename, pattern);
}

/**
 * Match simple wildcard patterns (e.g., *.ts, test-*.js)
 * Only supports * wildcard, not full glob syntax
 */
function matchSimplePattern(filename: string, pattern: string): boolean {
  // Validate pattern to prevent ReDoS
  if (pattern.length > 100 || (pattern.match(/\*/g) || []).length > 5) {
    console.warn(`Pattern too complex or too long: ${pattern}`);
    return false;
  }
  
  // Escape special regex characters except *
  // Including hyphen to prevent issues in character classes
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\\-]/g, '\\$&')
    .replace(/\*/g, '.*');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filename);
}

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
