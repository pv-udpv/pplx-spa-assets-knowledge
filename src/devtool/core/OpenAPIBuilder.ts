export interface OpenAPIEndpoint {
  method: string;
  path: string;
  summary?: string;
  responses: Record<string, any>;
  requestBody?: any;
  parameters?: any[];
  responseCount: number;
}

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string }>;
  paths: Record<string, any>;
}

export class OpenAPIBuilder {
  private endpoints: Map<string, OpenAPIEndpoint> = new Map();
  private storageKey = 'pplx-openapi-schema';

  constructor() {
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.endpoints = new Map(Object.entries(data));
      }
    } catch (e) {
      console.error('[OpenAPI] Failed to load:', e);
    }
  }

  save() {
    try {
      const data = Object.fromEntries(this.endpoints);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('[OpenAPI] Failed to save:', e);
    }
  }

  addEndpoint(
    path: string,
    method: string,
    response: { status: number; body: any; latency?: number }
  ) {
    const key = `${method} ${path}`;
    let endpoint = this.endpoints.get(key);

    if (!endpoint) {
      endpoint = {
        method,
        path,
        responses: {},
        responseCount: 0,
      };
    }

    // Add response example
    const statusKey = response.status.toString();
    if (!endpoint.responses[statusKey]) {
      endpoint.responses[statusKey] = {
        description: this.getStatusDescription(response.status),
        content: {
          'application/json': {
            schema: this.inferSchema(response.body),
            examples: [],
          },
        },
      };
    }

    // Add example (limit to 3 per status)
    const examples = endpoint.responses[statusKey].content['application/json'].examples;
    if (examples.length < 3) {
      examples.push({
        timestamp: new Date().toISOString(),
        value: response.body,
        latency: response.latency,
      });
    }

    endpoint.responseCount++;
    this.endpoints.set(key, endpoint);
    this.save();
  }

  private inferSchema(data: any): any {
    if (data === null) return { type: 'null' };
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.inferSchema(data[0]) : { type: 'object' },
      };
    }
    if (typeof data === 'object') {
      const properties: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        properties[key] = this.inferSchema(value);
      }
      return { type: 'object', properties };
    }
    if (typeof data === 'string') return { type: 'string' };
    if (typeof data === 'number') {
      return Number.isInteger(data) ? { type: 'integer' } : { type: 'number' };
    }
    if (typeof data === 'boolean') return { type: 'boolean' };
    return { type: 'string' };
  }

  private getStatusDescription(status: number): string {
    const descriptions: Record<number, string> = {
      200: 'Successful response',
      201: 'Created',
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      500: 'Internal server error',
    };
    return descriptions[status] || `HTTP ${status}`;
  }

  build(): OpenAPISchema {
    const paths: Record<string, any> = {};

    for (const [key, endpoint] of this.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
        operationId: `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/\//g, '_')}`,
        responses: endpoint.responses,
        ...(endpoint.requestBody && { requestBody: endpoint.requestBody }),
        ...(endpoint.parameters && { parameters: endpoint.parameters }),
      };
    }

    return {
      openapi: '3.1.0',
      info: {
        title: 'Perplexity API',
        version: '1.0.0',
        description: 'Auto-generated OpenAPI schema from live traffic capture',
      },
      servers: [{ url: 'https://www.perplexity.ai' }],
      paths,
    };
  }

  getEndpoints(): OpenAPIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  diff(other: OpenAPISchema): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const currentPaths = new Set(Object.keys(this.build().paths));
    const otherPaths = new Set(Object.keys(other.paths));

    const added = Array.from(currentPaths).filter((p) => !otherPaths.has(p));
    const removed = Array.from(otherPaths).filter((p) => !currentPaths.has(p));
    const modified: string[] = [];

    // Simple diff (could be more sophisticated)
    for (const path of currentPaths) {
      if (otherPaths.has(path)) {
        const current = JSON.stringify(this.build().paths[path]);
        const previous = JSON.stringify(other.paths[path]);
        if (current !== previous) {
          modified.push(path);
        }
      }
    }

    return { added, removed, modified };
  }

  clear() {
    this.endpoints.clear();
    this.save();
  }
}
