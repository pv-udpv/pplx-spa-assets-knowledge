/**
 * Automated asset fetching from Perplexity AI SPA
 */

import https from 'node:https';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

export interface FetchProgress {
  url: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  size: number;
  hash?: string;
  error?: string;
}

export interface FetchOptions {
  baseUrl: string;
  timeout: number;
  retries: number;
  cacheDir: string;
  followRedirects: boolean;
}

export class AssetFetcher {
  private options: FetchOptions;
  private progress: Map<string, FetchProgress> = new Map();

  constructor(options: Partial<FetchOptions> = {}) {
    this.options = {
      baseUrl: 'https://pplx-next-static-public.perplexity.ai',
      timeout: 30000,
      retries: 3,
      cacheDir: './assets-cache',
      followRedirects: true,
      ...options,
    };
  }

  /**
   * Fetch manifest of all assets from CDN
   */
  async fetchManifest(): Promise<string[]> {
    // Try to fetch index/manifest if available
    // Fallback: scrape common asset paths from HTML
    const commonPaths = [
      '/index.html',
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/webpack.js',
      '/_next/static/chunks/pages/_app.js',
      '/main.bundle.js',
    ];

    return commonPaths;
  }

  /**
   * Fetch JavaScript bundle and extract nested imports/requires
   */
  async fetchAsset(relativePath: string, retries = this.options.retries): Promise<Buffer> {
    const url = `${this.options.baseUrl}${relativePath}`;
    const progress: FetchProgress = {
      url,
      status: 'pending',
      size: 0,
    };

    this.progress.set(url, progress);

    try {
      progress.status = 'downloading';
      const buffer = await this.downloadWithRetry(url, retries);
      progress.size = buffer.length;
      progress.hash = this.calculateHash(buffer);
      progress.status = 'completed';
      return buffer;
    } catch (error) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Fetch multiple assets in parallel with rate limiting
   */
  async fetchAssets(
    paths: string[],
    concurrency = 3
  ): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>();
    const queue = [...paths];
    const active: Promise<void>[] = [];

    while (queue.length > 0 || active.length > 0) {
      while (active.length < concurrency && queue.length > 0) {
        const path = queue.shift()!;
        const promise = this.fetchAsset(path)
          .then(buffer => {
            results.set(path, buffer);
          })
          .catch(err => {
            console.error(`Failed to fetch ${path}:`, err.message);
          })
          .finally(() => {
            active.splice(active.indexOf(promise), 1);
          });

        active.push(promise);
      }

      if (active.length > 0) {
        await Promise.race(active);
      }
    }

    return results;
  }

  /**
   * Save fetched asset to disk
   */
  async saveAsset(
    relativePath: string,
    buffer: Buffer
  ): Promise<string> {
    const filePath = `${this.options.cacheDir}${relativePath}`;
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Get progress statistics
   */
  getProgress(): {
    total: number;
    completed: number;
    failed: number;
    details: FetchProgress[];
  } {
    const details = Array.from(this.progress.values());
    return {
      total: details.length,
      completed: details.filter(p => p.status === 'completed').length,
      failed: details.filter(p => p.status === 'failed').length,
      details,
    };
  }

  private async downloadWithRetry(
    url: string,
    retries: number
  ): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.downloadUrl(url);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Download failed');
  }

  private downloadUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let timeoutHandle: NodeJS.Timeout | null = null;

      const request = https.get(url, response => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          if (this.options.followRedirects && response.headers.location) {
            this.downloadUrl(response.headers.location).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          resolve(Buffer.concat(chunks));
        });
        response.on('error', error => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          reject(error);
        });
      });

      timeoutHandle = setTimeout(() => {
        request.destroy(new Error('Download timeout'));
      }, this.options.timeout);

      request.on('error', error => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(error);
      });
    });
  }

  private calculateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
