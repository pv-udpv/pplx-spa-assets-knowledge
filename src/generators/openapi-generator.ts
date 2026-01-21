/**
 * OpenAPI v3 specification generator
 */

import { writeFile } from 'node:fs/promises';
import { stringify } from 'yaml';
import type { APIEndpoint, SpecGenerationConfig } from '../types/index.js';
import type { OpenAPIV3_1 } from 'openapi-types';

export class OpenAPIGenerator {
  private config: SpecGenerationConfig;

  constructor(config: SpecGenerationConfig) {
    this.config = config;
  }

  /**
   * Generate OpenAPI v3.1 specification from extracted endpoints
   */
  async generate(endpoints: APIEndpoint[], outputPath: string): Promise<void> {
    const spec = this.buildSpec(endpoints);
    const yaml = stringify(spec as Record<string, unknown>);
    await writeFile(outputPath, yaml, 'utf-8');
  }

  private buildSpec(endpoints: APIEndpoint[]): OpenAPIV3_1.Document {
    const paths: OpenAPIV3_1.PathsObject = {};

    for (const endpoint of endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      const method = endpoint.method.toLowerCase() as Lowercase<typeof endpoint.method>;
      if (method !== 'ws') {
        paths[endpoint.path]![method] = this.buildOperation(endpoint) as any;
      }
    }

    return {
      openapi: '3.1.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
      },
      servers: this.config.servers?.map(s => {
        const server: OpenAPIV3_1.ServerObject = {
          url: s.url,
          description: s.description,
        };
        if (s.variables && Object.keys(s.variables).length > 0) {
          server.variables = s.variables as any;
        }
        return server;
      }) || [],
      paths,
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    };
  }

  private buildOperation(endpoint: APIEndpoint): OpenAPIV3_1.OperationObject {
    return {
      summary: endpoint.description || `${endpoint.method} ${endpoint.path}`,
      operationId: this.generateOperationId(endpoint),
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: endpoint.responseType ? { $ref: `#/components/schemas/${endpoint.responseType}` } : {},
            },
          },
        },
      },
      ...(endpoint.requestType && {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${endpoint.requestType}` },
            },
          },
        },
      }),
    };
  }

  private generateOperationId(endpoint: APIEndpoint): string {
    const path = endpoint.path.replace(/[^a-zA-Z0-9]/g, '_');
    return `${endpoint.method.toLowerCase()}_${path}`;
  }
}
