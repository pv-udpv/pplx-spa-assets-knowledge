/**
 * AsyncAPI v3 specification generator for WebSocket and event-driven APIs
 */

import { writeFile } from 'node:fs/promises';
import { stringify } from 'yaml';
import type { APIEndpoint, SpecGenerationConfig } from '../types/index.js';

export interface AsyncAPIDocument {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Record<string, AsyncAPIServer>;
  channels: Record<string, AsyncAPIChannel>;
  operations: Record<string, AsyncAPIOperation>;
  components?: {
    schemas?: Record<string, unknown>;
    messages?: Record<string, AsyncAPIMessage>;
  };
}

export interface AsyncAPIServer {
  host: string;
  protocol: string;
  description?: string;
}

export interface AsyncAPIChannel {
  address: string;
  messages: Record<string, { $ref: string }>;
  description?: string;
}

export interface AsyncAPIOperation {
  action: 'send' | 'receive';
  channel: { $ref: string };
  messages?: Array<{ $ref: string }>;
}

export interface AsyncAPIMessage {
  name: string;
  title: string;
  summary?: string;
  contentType: string;
  payload: unknown;
}

export class AsyncAPIGenerator {
  private config: SpecGenerationConfig;

  constructor(config: SpecGenerationConfig) {
    this.config = config;
  }

  /**
   * Generate AsyncAPI v3 specification for WebSocket endpoints
   */
  async generate(endpoints: APIEndpoint[], outputPath: string): Promise<void> {
    const wsEndpoints = endpoints.filter(e => e.method === 'WS');
    const spec = this.buildSpec(wsEndpoints);
    const yaml = stringify(spec);
    await writeFile(outputPath, yaml, 'utf-8');
  }

  private buildSpec(endpoints: APIEndpoint[]): AsyncAPIDocument {
    const channels: Record<string, AsyncAPIChannel> = {};
    const operations: Record<string, AsyncAPIOperation> = {};

    for (const endpoint of endpoints) {
      const channelName = this.sanitizeChannelName(endpoint.path);
      
      channels[channelName] = {
        address: endpoint.path,
        messages: {
          message: { $ref: `#/components/messages/${channelName}Message` },
        },
        description: endpoint.description,
      };

      operations[`${channelName}Send`] = {
        action: 'send',
        channel: { $ref: `#/channels/${channelName}` },
      };

      operations[`${channelName}Receive`] = {
        action: 'receive',
        channel: { $ref: `#/channels/${channelName}` },
      };
    }

    return {
      asyncapi: '3.0.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
      },
      servers: {
        production: {
          host: this.config.baseUrl || 'wss://www.perplexity.ai',
          protocol: 'wss',
          description: 'Production WebSocket server',
        },
      },
      channels,
      operations,
      components: {
        schemas: {},
        messages: {},
      },
    };
  }

  private sanitizeChannelName(path: string): string {
    return path.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
  }
}
