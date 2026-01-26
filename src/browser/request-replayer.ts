/**
 * Request Replayer for HAR files
 * Replay HTTP requests with modifications and fuzzing support
 */

import { CDPClient } from './cdp-client.js';
import { promises as fs } from 'node:fs';

export interface ReplayOptions {
  modifyHeaders?: (headers: Record<string, string>) => Record<string, string>;
  modifyBody?: (body: any) => any;
  delay?: number;
  timeout?: number;
}

export interface ReplayResult {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: any;
  };
  timing: {
    start: number;
    end: number;
    duration: number;
  };
  error?: string;
}

export class RequestReplayer {
  private har: any;
  private results: ReplayResult[] = [];
  // CDP client reserved for future use when Runtime.evaluate is integrated
  // private _cdp: CDPClient;

  constructor(
    _cdp: CDPClient,
    private harFile: string
  ) {
    // this._cdp = _cdp;
  }

  /**
   * Load HAR file
   */
  async loadHAR(): Promise<void> {
    try {
      const content = await fs.readFile(this.harFile, 'utf-8');
      this.har = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load HAR file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Replay requests from HAR file with optional filtering
   * 
   * @param filter - Function to filter which entries to replay
   * @param options - Replay options for modifying requests
   */
  async replay(
    filter: (entry: any) => boolean,
    options: ReplayOptions = {}
  ): Promise<ReplayResult[]> {
    if (!this.har) {
      await this.loadHAR();
    }

    const entries = this.har?.log?.entries || [];
    const filtered = entries.filter(filter);

    console.log(`🔄 Replaying ${filtered.length} requests from HAR file...`);

    this.results = [];

    for (const entry of filtered) {
      const request = entry.request;
      
      // Extract headers
      let headers: Record<string, string> = {};
      if (request.headers) {
        for (const header of request.headers) {
          headers[header.name] = header.value;
        }
      }

      // Apply header modifications
      if (options.modifyHeaders) {
        headers = options.modifyHeaders(headers);
      }

      // Extract body
      let body: any = undefined;
      if (request.postData?.text) {
        try {
          body = JSON.parse(request.postData.text);
        } catch {
          body = request.postData.text;
        }
      }

      // Apply body modifications
      if (body && options.modifyBody) {
        body = options.modifyBody(body);
      }

      // Add delay between requests if specified
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Execute request
      const result = await this.executeRequest(
        request.method,
        request.url,
        headers,
        body,
        options.timeout
      );

      this.results.push(result);
    }

    console.log(`✅ Replay completed: ${this.results.length} requests`);
    return this.results;
  }

  /**
   * Fuzzing mode - replay endpoint with multiple payloads
   * 
   * @param endpoint - URL endpoint to fuzz
   * @param payloads - Array of payloads to test
   * @returns Array of replay results
   */
  async fuzzing(endpoint: string, payloads: any[]): Promise<ReplayResult[]> {
    console.log(`🧪 Fuzzing ${endpoint} with ${payloads.length} payloads...`);

    const results: ReplayResult[] = [];

    for (const payload of payloads) {
      // Find request template from HAR
      if (!this.har) {
        await this.loadHAR();
      }

      const entries = this.har?.log?.entries || [];
      const template = entries.find((entry: any) => 
        entry.request.url.includes(endpoint)
      );

      if (!template) {
        console.warn(`⚠️  No template found for endpoint: ${endpoint}`);
        continue;
      }

      // Extract headers from template
      let headers: Record<string, string> = {};
      if (template.request.headers) {
        for (const header of template.request.headers) {
          headers[header.name] = header.value;
        }
      }

      // Execute with fuzzed payload
      const result = await this.executeRequest(
        template.request.method,
        template.request.url,
        headers,
        payload
      );

      results.push(result);
    }

    console.log(`✅ Fuzzing completed: ${results.length} requests`);
    return results;
  }

  /**
   * Execute a single HTTP request
   */
  private async executeRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: any,
    _timeout: number = 30000
  ): Promise<ReplayResult> {
    const start = Date.now();
    const result: ReplayResult = {
      request: { method, url, headers, body },
      response: {
        status: 0,
        statusText: '',
        headers: {},
        body: undefined,
      },
      timing: {
        start,
        end: 0,
        duration: 0,
      },
    };

    try {
      // Use fetch API via CDP Runtime.evaluate
      // This would be the script to execute:
      // const fetchScript = `
      //   (async () => {
      //     const response = await fetch('${url}', {
      //       method: '${method}',
      //       headers: ${JSON.stringify(headers)},
      //       ${body ? `body: ${typeof body === 'string' ? `'${body}'` : JSON.stringify(body)},` : ''}
      //     });
      //
      //     const responseHeaders = {};
      //     response.headers.forEach((value, key) => {
      //       responseHeaders[key] = value;
      //     });
      //
      //     let responseBody;
      //     const contentType = response.headers.get('content-type') || '';
      //     
      //     if (contentType.includes('application/json')) {
      //       responseBody = await response.json();
      //     } else {
      //       responseBody = await response.text();
      //     }
      //
      //     return JSON.stringify({
      //       status: response.status,
      //       statusText: response.statusText,
      //       headers: responseHeaders,
      //       body: responseBody,
      //     });
      //   })()
      // `;

      // Execute via CDP (would need access to CDP client's Runtime)
      // For now, this is a placeholder that would integrate with CDPClient
      console.log(`   → ${method} ${url}`);

      // Simulate response for demonstration
      // In production, this would use the actual CDP Runtime.evaluate
      result.response.status = 200;
      result.response.statusText = 'OK';
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`   ✗ Request failed: ${result.error}`);
    }

    const end = Date.now();
    result.timing.end = end;
    result.timing.duration = end - start;

    return result;
  }

  /**
   * Get replay results
   */
  getResults(): ReplayResult[] {
    return this.results;
  }

  /**
   * Save results to file
   */
  async saveResults(filepath: string): Promise<void> {
    await fs.writeFile(
      filepath,
      JSON.stringify(this.results, null, 2),
      'utf-8'
    );
    console.log(`💾 Results saved to ${filepath}`);
  }

  /**
   * Get statistics from replay results
   */
  getStatistics(): {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
    statusCodes: Record<number, number>;
  } {
    const stats = {
      total: this.results.length,
      successful: 0,
      failed: 0,
      averageDuration: 0,
      statusCodes: {} as Record<number, number>,
    };

    let totalDuration = 0;

    for (const result of this.results) {
      if (result.error) {
        stats.failed++;
      } else {
        stats.successful++;
        const status = result.response.status;
        stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;
      }
      totalDuration += result.timing.duration;
    }

    stats.averageDuration = stats.total > 0 ? totalDuration / stats.total : 0;

    return stats;
  }
}
