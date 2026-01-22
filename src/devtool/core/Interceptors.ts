export type InterceptorCallback = (
  method: string,
  url: string,
  status: number,
  data: any,
  latency: number
) => void;

export class Interceptors {
  private callbacks: InterceptorCallback[] = [];
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  onIntercept(callback: InterceptorCallback) {
    this.callbacks.push(callback);
  }

  start() {
    this.interceptFetch();
    this.interceptXHR();
    console.log('[Interceptors] Started');
  }

  stop() {
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    console.log('[Interceptors] Stopped');
  }

  private interceptFetch() {
    const self = this;

    window.fetch = async function (...args: Parameters<typeof fetch>) {
      const [url, options] = args;
      const urlStr = typeof url === 'string' ? url : url.toString();
      const method = options?.method || 'GET';

      const startTime = performance.now();

      try {
        const response = await self.originalFetch.apply(window, args);
        const endTime = performance.now();
        const latency = endTime - startTime;

        // Clone response to read body
        const clonedResponse = response.clone();
        let data: any;

        try {
          data = await clonedResponse.json();
        } catch {
          data = await clonedResponse.text();
        }

        // Notify callbacks
        for (const callback of self.callbacks) {
          callback(method, urlStr, response.status, data, latency);
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;

        // Notify callbacks about error
        for (const callback of self.callbacks) {
          callback(method, urlStr, 0, { error: (error as Error).message }, latency);
        }

        throw error;
      }
    };
  }

  private interceptXHR() {
    const self = this;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: any[]
    ) {
      (this as any)._method = method;
      (this as any)._url = url.toString();
      (this as any)._startTime = performance.now();

      return self.originalXHROpen.apply(this, [method, url, ...rest] as any);
    };

    XMLHttpRequest.prototype.send = function (body?: any) {
      const xhr = this;

      xhr.addEventListener('loadend', function () {
        const endTime = performance.now();
        const latency = endTime - ((xhr as any)._startTime || endTime);

        let data: any;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = xhr.responseText;
        }

        // Notify callbacks
        for (const callback of self.callbacks) {
          callback(
            (xhr as any)._method || 'GET',
            (xhr as any)._url || '',
            xhr.status,
            data,
            latency
          );
        }
      });

      return self.originalXHRSend.apply(this, [body] as any);
    };
  }
}
