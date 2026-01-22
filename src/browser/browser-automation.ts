/**
 * Browser automation orchestrator
 */

import { spawn, SpawnOptionsWithoutStdio } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { CDPClient } from './cdp-client.js';
import type { CaptureConfig, BrowserSession } from '../types/index.js';

export class BrowserAutomation {
  private config: CaptureConfig;
  private cdpClient: CDPClient | null = null;
  private chromeProcess: ReturnType<typeof spawn> | null = null;

  constructor(config: CaptureConfig) {
    this.config = config;
  }

  /**
   * Start Chrome instance with CDP enabled
   */
  async startChrome(): Promise<number> {
    return new Promise((resolve, reject) => {
      const args = [
        `--remote-debugging-port=${this.config.chrome.port}`,
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
      ];

      if (this.config.headless) {
        args.push('--headless=new');
      }

      // Load extension if enabled
      if (this.config.extension.enabled && this.config.extension.path) {
        args.push(`--load-extension=${this.config.extension.path}`);
      }

      const executable = this.config.chrome.executable || 'google-chrome';
      console.log(`🚀 Starting Chrome: ${executable}`);

      this.chromeProcess = spawn(executable, args, {
        stdio: 'ignore',
      } as unknown as SpawnOptionsWithoutStdio);

      this.chromeProcess.on('error', reject);

      // Wait for Chrome to be ready
      setTimeout(() => resolve(this.chromeProcess!.pid!), 2000);
    });
  }

  /**
   * Initialize CDP client and connect
   */
  async connectCDP(): Promise<void> {
    this.cdpClient = new CDPClient(this.config);
    await this.cdpClient.connect(this.config.chrome.port);
  }

  /**
   * Execute a task with capture
   */
  async executeTask(
    taskName: string,
    task: (browser: CDPClient) => Promise<void>
  ): Promise<void> {
    if (!this.cdpClient) throw new Error('CDP client not initialized');

    console.log(`\n📋 Task: ${taskName}`);
    console.log('═'.repeat(60));

    try {
      await this.cdpClient.executeWithCapture(async () => {
        await task(this.cdpClient!);
      }, taskName);
    } catch (error) {
      console.error(`❌ Task failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get CDP client for direct access
   */
  getCDPClient(): CDPClient {
    if (!this.cdpClient) throw new Error('CDP client not initialized');
    return this.cdpClient;
  }

  /**
   * Save all captures
   */
  async saveCaptures(): Promise<void> {
    if (!this.cdpClient) throw new Error('CDP client not initialized');

    const outputDir = this.config.output.dir;
    await fs.mkdir(outputDir, { recursive: true });

    await this.cdpClient.captureStorage();
    await this.cdpClient.saveCapture(outputDir);

    console.log(`\n✅ All captures saved to: ${outputDir}`);
  }

  /**
   * Cleanup: close connections and kill Chrome
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleanup...');

    if (this.cdpClient) {
      await this.cdpClient.close();
    }

    if (this.chromeProcess) {
      this.chromeProcess.kill('SIGTERM');
      console.log('✅ Chrome process terminated');
    }
  }
}

/**
 * Create and run a browser session
 */
export async function runBrowserSession(
  config: CaptureConfig,
  sessionFn: (browser: BrowserAutomation) => Promise<void>
): Promise<void> {
  const browser = new BrowserAutomation(config);

  try {
    await browser.startChrome();
    await browser.connectCDP();
    await sessionFn(browser);
    await browser.saveCaptures();
  } catch (error) {
    console.error('❌ Browser session failed:', error);
    throw error;
  } finally {
    await browser.cleanup();
  }
}
