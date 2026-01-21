#!/usr/bin/env node
/**
 * CLI interface for asset parsing and spec generation
 */

import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { AssetFetcher } from './fetchers/asset-fetcher.js';
import { runBrowserSession } from './browser/browser-automation.js';
import { capturePresets } from './browser/capture-config.js';

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
  .option('--no-headless', 'Disable headless mode (run with GUI)')
  .option('-o, --output <dir>', 'Output directory for captures', './captures')
  .action(async (options) => {
    console.log('🌐 Browser Automation Pipeline');
    console.log('═'.repeat(60));

    try {
      let config = capturePresets[options.preset as keyof typeof capturePresets] || capturePresets.apiReversing;
      config.chrome.port = parseInt(options.chromePort);
      config.output.dir = options.output;
      config.headless = options.headless;

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
