import type { PerplexityAPI } from '../../../core/PerplexityAPI';
import type { CoverageTracker } from '../../../core/CoverageTracker';

export class APIExplorerTab {
  constructor(
    private api: PerplexityAPI,
    private coverage: CoverageTracker
  ) {}

  mount($el: HTMLElement) {
    $el.innerHTML = `
      <div class="api-explorer">
        <div class="coverage-summary">
          <h4>📊 API Coverage</h4>
          <div id="coverage-stats"></div>
        </div>
        
        <div class="endpoint-categories">
          <h4>🔍 Endpoints</h4>
          <div id="endpoint-list"></div>
        </div>
        
        <div class="response-viewer">
          <h4>📄 Response</h4>
          <pre id="response-output">Select endpoint to test...</pre>
        </div>
      </div>
    `;

    this.attachStyles($el);
    this.renderCoverage($el.querySelector('#coverage-stats')!);
    this.renderEndpoints($el.querySelector('#endpoint-list')!);
  }

  private attachStyles($root: HTMLElement) {
    const style = document.createElement('style');
    style.textContent = `
      .api-explorer {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .api-explorer h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #667eea;
      }
      .coverage-summary {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      #coverage-stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .coverage-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
      .category {
        min-width: 80px;
        color: #aaa;
      }
      .progress-bar {
        flex: 1;
        height: 6px;
        background: #333;
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s ease;
      }
      .percentage {
        min-width: 40px;
        text-align: right;
        color: #667eea;
        font-weight: 600;
      }
      .endpoint-categories {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
      }
      #endpoint-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .endpoint-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 11px;
        text-align: left;
      }
      .endpoint-btn:hover {
        background: #333;
        border-color: #667eea;
      }
      .method {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .method-get { background: #61affe; color: #000; }
      .method-post { background: #49cc90; color: #000; }
      .method-put { background: #fca130; color: #000; }
      .method-delete { background: #f93e3e; color: #fff; }
      .path {
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #ddd;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .response-viewer {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      #response-output {
        margin: 0;
        padding: 10px;
        background: #1a1a1a;
        border-radius: 4px;
        font-size: 11px;
        line-height: 1.4;
        overflow-x: auto;
        max-height: 200px;
        overflow-y: auto;
      }
    `;
    $root.appendChild(style);
  }

  private renderCoverage($el: HTMLElement) {
    const stats = this.coverage.getStats();

    if (Object.keys(stats).length === 0) {
      $el.innerHTML = '<p style="color: #aaa; font-size: 12px;">No coverage data yet. Test some endpoints!</p>';
      return;
    }

    $el.innerHTML = Object.entries(stats)
      .map(
        ([category, stat]) => `
        <div class="coverage-item">
          <span class="category">${category}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${stat.coverage}%"></div>
          </div>
          <span class="percentage">${stat.coverage}%</span>
        </div>
      `
      )
      .join('');
  }

  private renderEndpoints($el: HTMLElement) {
    const endpoints = this.api.getEndpoints();

    if (endpoints.length === 0) {
      $el.innerHTML = '<p style="color: #aaa; font-size: 12px;">No endpoints available. Check API schema.</p>';
      return;
    }

    $el.innerHTML = endpoints
      .map(
        (endpoint) => `
        <button class="endpoint-btn" 
                data-method="${endpoint.method}"
                data-path="${endpoint.path}"
                data-category="${endpoint.category}">
          <span class="method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
          <span class="path">${endpoint.path}</span>
        </button>
      `
      )
      .join('');

    // Attach click handlers
    $el.querySelectorAll('.endpoint-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const method = target.dataset.method!;
        const path = target.dataset.path!;
        await this.testEndpoint(method, path);
      });
    });
  }

  private async testEndpoint(method: string, path: string) {
    const output = document.querySelector('#response-output') as HTMLElement;
    output.textContent = `⏳ Testing ${method} ${path}...`;

    try {
      const response = await this.api.fetch(path, { method });

      output.textContent = JSON.stringify(
        {
          status: response.status,
          ok: response.ok,
          latency: `${response.latency?.toFixed(2)}ms`,
          data: response.data,
        },
        null,
        2
      );

      // Update coverage
      this.coverage.markCalled(method, path, response.status, response.latency);
      const coverageEl = document.querySelector('#coverage-stats');
      if (coverageEl instanceof HTMLElement) {
        this.renderCoverage(coverageEl);
      }
    } catch (error) {
      output.textContent = `❌ Error: ${(error as Error).message}`;
    }
  }
}
