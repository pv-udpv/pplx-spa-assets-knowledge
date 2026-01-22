/**
 * Chrome DevTools Protocol client for browser automation and data capture
 */

import CDP from 'chrome-remote-interface';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { CaptureConfig, CaptureData } from '../types/index.js';

export class CDPClient {
  private client: any = null;
  private config: CaptureConfig;
  private captureData: CaptureData;
  private wsMessages: Array<{ type: string; data: unknown; timestamp: number }> = [];
  private harEntries: Array<Record<string, unknown>> = [];
  // Reserved for future use
  // private storageData: Record<string, Record<string, string>> = {};
  // private callstack: Array<{ function: string; url: string; lineNumber: number; columnNumber: number }> = [];

  constructor(config: CaptureConfig) {
    this.config = config;
    this.captureData = {
      timestamp: new Date().toISOString(),
      url: '',
      har: { log: { version: '1.2', creator: { name: 'pplx-spa-assets', version: '1.0' }, entries: [] } },
      websocketMessages: [],
      eventStreamEvents: [],
      localStorage: {},
      sessionStorage: {},
      cookies: [],
      callstacks: [],
      console: [],
      networkTimings: {},
    };
  }

  /**
   * Connect to Chrome DevTools Protocol
   */
  async connect(port = 9222): Promise<void> {
    try {
      this.client = await CDP({ port });
      console.log(`✅ Connected to Chrome DevTools Protocol on port ${port}`);

      const { Network, Page, Runtime, Storage, Log } = this.client as any;

      // Enable required domains
      await Promise.all([
        Network.enable(),
        Page.enable(),
        Runtime.enable(),
        Storage.enable(),
        Log.enable(),
      ]);

      // Setup listeners
      if (this.config.capture.har || this.config.capture.network) {
        this.setupNetworkCapture(Network);
      }
      if (this.config.capture.websocket) {
        this.setupWebSocketCapture();
      }
      if (this.config.capture.storage) {
        this.setupStorageCapture(Storage);
      }
      if (this.config.capture.callstack) {
        this.setupCallstackCapture(Runtime);
      }
      if (this.config.capture.console) {
        this.setupConsoleCapture(Runtime);
      }
    } catch (error) {
      console.error('❌ Failed to connect to CDP:', error);
      throw error;
    }
  }

  /**
   * Navigate to URL and capture data
   */
  async navigate(url: string, options: { waitUntil?: 'load' | 'networkidle0' | 'networkidle2'; timeout?: number } = {}): Promise<void> {
    if (!this.client) throw new Error('CDP client not connected');

    const { Page, Network } = this.client as any;
    const waitUntil = options.waitUntil || 'networkidle2';
    const timeout = options.timeout || this.config.timeout;

    this.captureData.url = url;

    try {
      console.log(`🌐 Navigating to ${url}...`);

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Navigation timeout')), timeout);

        Page.frameNavigated(async () => {
          if (waitUntil === 'load') {
            await Page.loadEventFired();
            clearTimeout(timeoutId);
            resolve();
          }
        });

        Network.requestWillBeSent(() => {
          // Track network requests
        });

        Page.navigate({ url });
      });
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      throw error;
    }
  }

  /**
   * Execute function and capture callstack
   */
  async executeWithCapture(
    asyncFn: () => Promise<void>,
    label: string
  ): Promise<void> {
    if (!this.client) throw new Error('CDP client not connected');

    const { Runtime } = this.client as any;
    const startTime = Date.now();

    console.log(`⚙️  Executing: ${label}`);

    try {
      // Enable pause on exceptions to capture callstacks
      await Runtime.setPauseOnExceptions('all');

      await asyncFn();

      const duration = Date.now() - startTime;
      this.captureData.networkTimings[label] = duration;
      console.log(`✅ ${label} completed in ${duration}ms`);
    } catch (error) {
      console.error(`❌ ${label} failed:`, error);
      throw error;
    } finally {
      await Runtime.setPauseOnExceptions('none');
    }
  }

  /**
   * Capture current storage (localStorage, sessionStorage, cookies)
   */
  async captureStorage(): Promise<void> {
    if (!this.client) throw new Error('CDP client not connected');

    const { Runtime, Storage } = this.client as any;

    try {
      // Get localStorage
      if (this.config.capture.storage) {
        const localStorageScript = `
          JSON.stringify(Object.entries(localStorage).reduce((acc, [k, v]) => {
            try { acc[k] = v; } catch(e) { }
            return acc;
          }, {}))
        `;
        const localStorageResult = await Runtime.evaluate({ expression: localStorageScript });
        if (localStorageResult.value) {
          this.captureData.localStorage = JSON.parse(localStorageResult.value);
        }

        // Get sessionStorage
        const sessionStorageScript = `
          JSON.stringify(Object.entries(sessionStorage).reduce((acc, [k, v]) => {
            try { acc[k] = v; } catch(e) { }
            return acc;
          }, {}))
        `;
        const sessionStorageResult = await Runtime.evaluate({ expression: sessionStorageScript });
        if (sessionStorageResult.value) {
          this.captureData.sessionStorage = JSON.parse(sessionStorageResult.value);
        }
      }

      // Get cookies
      if (this.config.capture.cookies) {
        const cookies = await Storage.getCookies();
        this.captureData.cookies = cookies.cookies || [];
      }
    } catch (error) {
      console.error('⚠️  Storage capture failed:', error);
    }
  }

  /**
   * Save captured data to files
   */
  async saveCapture(outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = `capture-${timestamp}`;

    // Save HAR
    if (this.config.capture.har) {
      this.captureData.har.log.entries = this.harEntries as any;
      await fs.writeFile(
        join(outputDir, `${baseFileName}.har.json`),
        JSON.stringify(this.captureData.har, null, 2),
        'utf-8'
      );
      console.log(`📁 HAR saved: ${baseFileName}.har.json`);
    }

    // Save WebSocket messages
    if (this.config.capture.websocket && this.wsMessages.length > 0) {
      await fs.writeFile(
        join(outputDir, `${baseFileName}.ws.jsonl`),
        this.wsMessages.map(m => JSON.stringify(m)).join('\n'),
        'utf-8'
      );
      console.log(`📁 WebSocket messages saved: ${baseFileName}.ws.jsonl`);
    }

    // Save storage
    if (this.config.capture.storage) {
      await fs.writeFile(
        join(outputDir, `${baseFileName}.storage.json`),
        JSON.stringify(
          {
            localStorage: this.captureData.localStorage,
            sessionStorage: this.captureData.sessionStorage,
            cookies: this.captureData.cookies,
          },
          null,
          2
        ),
        'utf-8'
      );
      console.log(`📁 Storage saved: ${baseFileName}.storage.json`);
    }

    // Save full capture metadata
    await fs.writeFile(
      join(outputDir, `${baseFileName}.metadata.json`),
      JSON.stringify(this.captureData, null, 2),
      'utf-8'
    );
    console.log(`📁 Metadata saved: ${baseFileName}.metadata.json`);
  }

  /**
   * Close CDP connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('👋 CDP connection closed');
    }
  }

  private setupNetworkCapture(Network: any): void {
    Network.requestWillBeSent(({ request, timestamp }: any) => {
      this.harEntries.push({
        startedDateTime: new Date(timestamp * 1000).toISOString(),
        time: 0,
        request: {
          method: request.method,
          url: request.url,
          httpVersion: 'HTTP/1.1',
          headers: Object.entries(request.headers).map(([name, value]) => ({ name, value })),
          queryString: [],
          cookies: [],
          headersSize: 0,
          bodySize: 0,
        },
        response: { status: 0, statusText: '', headers: [], cookies: [], content: { size: 0, mimeType: '' }, redirectURL: '', headersSize: 0, bodySize: 0, _transferSize: 0 },
        cache: {},
        timings: { blocked: 0, dns: 0, connect: 0, send: 0, wait: 0, receive: 0, ssl: 0 },
      });
    });

    Network.responseReceived(({ response }: any) => {
      const entry = this.harEntries.find((e: any) => e.request?.url === response.url);
      if (entry) {
        entry.response = {
          status: response.status,
          statusText: response.statusText,
          httpVersion: response.protocol,
          headers: Object.entries(response.headers).map(([name, value]) => ({ name, value })),
          cookies: [],
          content: { size: 0, mimeType: response.mimeType },
          redirectURL: response.url,
          headersSize: 0,
          bodySize: 0,
          _transferSize: response.encodedDataLength || 0,
        };
      }
    });
  }

  private setupWebSocketCapture(): void {
    // This requires extension communication (see extension files)
    console.log('🔄 WebSocket capture enabled via extension');
  }

  private setupStorageCapture(Storage: any): void {
    Storage.storageKeyUpdated(() => {
      // Trigger storage capture on change
    });
  }

  private setupCallstackCapture(Runtime: any): void {
    Runtime.exceptionThrown(({ exceptionDetails }: any) => {
      if (exceptionDetails.stackTrace) {
        this.captureData.callstacks.push(exceptionDetails.stackTrace.callFrames);
      }
    });
  }

  private setupConsoleCapture(Runtime: any): void {
    Runtime.consoleAPICalled(({ type, args, timestamp }: any) => {
      this.captureData.console.push({
        type,
        timestamp: new Date(timestamp * 1000).toISOString(),
        arguments: args,
      });
    });
  }

  /**
   * Get captured data
   */
  getCaptureData(): CaptureData {
    return this.captureData;
  }
}
