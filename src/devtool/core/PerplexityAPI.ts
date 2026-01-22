export interface APIResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  headers?: Record<string, string>;
  latency?: number;
}

export interface EndpointSpec {
  method: string;
  path: string;
  category: string;
  operationId?: string;
  summary?: string;
  parameters?: any[];
  has_request_body?: boolean;
}

export class PerplexityAPI {
  private baseURL = 'https://www.perplexity.ai';
  private endpoints: EndpointSpec[] = [];

  constructor(endpoints: EndpointSpec[] = []) {
    this.endpoints = endpoints;
  }

  async fetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        credentials: 'include',
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as any;
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        ok: response.ok,
        status: response.status,
        data,
        headers,
        latency,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        ok: false,
        status: 0,
        data: { error: (error as Error).message } as T,
        latency: endTime - startTime,
      };
    }
  }

  getEndpoints(): EndpointSpec[] {
    return this.endpoints;
  }

  setEndpoints(endpoints: EndpointSpec[]) {
    this.endpoints = endpoints;
  }

  findEndpoint(method: string, path: string): EndpointSpec | undefined {
    return this.endpoints.find(
      (ep) => ep.method === method && ep.path === path
    );
  }
}
