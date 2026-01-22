import type { ErudaPlugin } from '../../types/eruda';
import { PerplexityAPI, type EndpointSpec } from '../../core/PerplexityAPI';
import { CoverageTracker } from '../../core/CoverageTracker';
import { OpenAPIBuilder } from '../../core/OpenAPIBuilder';
import { Interceptors } from '../../core/Interceptors';
import { APIExplorerTab } from './tabs/APIExplorerTab';
import { SchemaTab } from './tabs/SchemaTab';
import { NetworkTab } from './tabs/NetworkTab';
import { SettingsTab } from './tabs/SettingsTab';
import { API_SCHEMA } from '../../data/schema';

export class PerplexityDevTool implements ErudaPlugin {
  name = 'Perplexity';

  private api: PerplexityAPI;
  private coverage: CoverageTracker;
  private builder: OpenAPIBuilder;
  private interceptors: Interceptors;
  private schemaTab: SchemaTab | null = null;
  private networkTab: NetworkTab | null = null;

  constructor() {
    // Initialize core modules
    this.api = new PerplexityAPI();
    this.coverage = new CoverageTracker();
    this.builder = new OpenAPIBuilder();
    this.interceptors = new Interceptors();

    // Load API schema
    this.loadSchema();
  }

  init($el: HTMLElement) {
    $el.innerHTML = `
      <div class="pplx-devtool">
        <div class="pplx-tabs">
          <button class="pplx-tab active" data-tab="api">📦 API</button>
          <button class="pplx-tab" data-tab="schema">📋 Schema</button>
          <button class="pplx-tab" data-tab="network">🌐 Network</button>
          <button class="pplx-tab" data-tab="settings">⚙️ Settings</button>
        </div>
        <div class="pplx-content">
          <div class="pplx-tab-content active" id="tab-api"></div>
          <div class="pplx-tab-content" id="tab-schema"></div>
          <div class="pplx-tab-content" id="tab-network"></div>
          <div class="pplx-tab-content" id="tab-settings"></div>
        </div>
      </div>
    `;

    this.attachStyles($el);
    this.attachTabHandlers($el);
    this.mountTabs($el);
    this.startInterceptors();
  }

  private attachStyles($root: HTMLElement) {
    const style = document.createElement('style');
    style.textContent = `
      .pplx-devtool {
        padding: 12px;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .pplx-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 12px;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
      }
      .pplx-tab {
        background: transparent;
        border: none;
        color: #aaa;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      .pplx-tab:hover {
        background: #333;
        color: #fff;
      }
      .pplx-tab.active {
        background: #667eea;
        color: #fff;
      }
      .pplx-tab-content {
        display: none;
      }
      .pplx-tab-content.active {
        display: block;
      }
      .actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }
      .action-btn {
        padding: 8px 12px;
        background: #667eea;
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .action-btn:hover {
        background: #5568d3;
      }
      .action-btn.primary {
        background: #49cc90;
        grid-column: span 2;
      }
      .action-btn.primary:hover {
        background: #3bb77e;
      }
      .action-btn.danger {
        background: #f93e3e;
      }
      .action-btn.danger:hover {
        background: #e02929;
      }
    `;
    $root.appendChild(style);
  }

  private attachTabHandlers($root: HTMLElement) {
    $root.querySelectorAll('.pplx-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).dataset.tab;
        if (target) {
          this.switchTab($root, target);
        }
      });
    });
  }

  private switchTab($root: HTMLElement, tab: string) {
    $root.querySelectorAll('.pplx-tab').forEach((t) => t.classList.remove('active'));
    $root.querySelectorAll('.pplx-tab-content').forEach((c) => c.classList.remove('active'));

    $root.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    $root.querySelector(`#tab-${tab}`)?.classList.add('active');
  }

  private mountTabs($root: HTMLElement) {
    // API Explorer
    const apiTab = new APIExplorerTab(this.api, this.coverage);
    const apiTabEl = $root.querySelector('#tab-api');
    if (apiTabEl instanceof HTMLElement) {
      apiTab.mount(apiTabEl);
    }

    // Schema Inspector
    const schemaTabEl = $root.querySelector('#tab-schema');
    if (schemaTabEl instanceof HTMLElement) {
      this.schemaTab = new SchemaTab(this.builder);
      this.schemaTab.mount(schemaTabEl);
    }

    // Network Monitor
    const networkTabEl = $root.querySelector('#tab-network');
    if (networkTabEl instanceof HTMLElement) {
      this.networkTab = new NetworkTab();
      this.networkTab.mount(networkTabEl);
    }

    // Settings
    const settingsTab = new SettingsTab();
    const settingsTabEl = $root.querySelector('#tab-settings');
    if (settingsTabEl instanceof HTMLElement) {
      settingsTab.mount(settingsTabEl);
    }
  }

  private loadSchema() {
    // Convert schema to endpoint specs
    const endpoints: EndpointSpec[] = [];

    for (const [category, data] of Object.entries(API_SCHEMA)) {
      for (const endpoint of (data as any).endpoints) {
        endpoints.push({
          method: endpoint.method,
          path: endpoint.path,
          category,
          operationId: endpoint.operationId,
          summary: endpoint.summary,
          parameters: endpoint.parameters,
          has_request_body: endpoint.has_request_body,
        });
      }

      // Initialize coverage tracking
      this.coverage.initCategory(
        category,
        (data as any).endpoints.map((ep: any) => ({
          method: ep.method,
          path: ep.path,
        }))
      );
    }

    this.api.setEndpoints(endpoints);
  }

  private startInterceptors() {
    // Listen to all network requests
    this.interceptors.onIntercept((method, url, status, data, latency) => {
      // Only track Perplexity requests
      if (!url.includes('perplexity.ai')) return;

      // Update coverage
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      this.coverage.markCalled(method, path, status, latency);

      // Update OpenAPI schema
      this.builder.addEndpoint(path, method, { status, body: data, latency });

      // Update schema tab UI
      if (this.schemaTab && typeof this.schemaTab.updateFromInterceptor === 'function') {
        this.schemaTab.updateFromInterceptor();
      }

      // Store in network log
      try {
        const log = JSON.parse(localStorage.getItem('pplx-network-log') || '[]');
        const newEntry = {
          timestamp: new Date().toISOString(),
          method,
          url,
          status,
          data,
          latency,
        };
        
        log.push(newEntry);
        
        // Keep last 100 entries
        if (log.length > 100) log.shift();
        
        const logStr = JSON.stringify(log);
        
        // Check size to prevent quota errors (keep under 5MB)
        if (logStr.length > 5 * 1024 * 1024) {
          // Remove oldest entries until under limit
          while (log.length > 0 && JSON.stringify(log).length > 5 * 1024 * 1024) {
            log.shift();
          }
          localStorage.setItem('pplx-network-log', JSON.stringify(log));
        } else {
          localStorage.setItem('pplx-network-log', logStr);
        }
      } catch (e) {
        console.error('[Interceptor] Failed to log request:', e);
      }
    });

    this.interceptors.start();
  }

  destroy() {
    this.interceptors.stop();
    
    // Clean up NetworkTab interval
    if (this.networkTab) {
      this.networkTab.destroy();
    }
  }
}
