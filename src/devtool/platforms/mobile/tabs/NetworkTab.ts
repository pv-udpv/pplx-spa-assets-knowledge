export interface NetworkStats {
  totalRequests: number;
  avgLatency: number;
  errorRate: number;
}

export class NetworkTab {
  private stats: NetworkStats = {
    totalRequests: 0,
    avgLatency: 0,
    errorRate: 0,
  };

  mount($el: HTMLElement) {
    $el.innerHTML = `
      <div class="network-monitor">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total Requests</span>
            <span class="stat-value" id="stat-total">0</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg Latency</span>
            <span class="stat-value" id="stat-latency">0ms</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Error Rate</span>
            <span class="stat-value" id="stat-errors">0%</span>
          </div>
        </div>
        
        <div class="actions">
          <button id="export-har-btn" class="action-btn">💾 Export HAR</button>
          <button id="clear-log-btn" class="action-btn danger">🗑️ Clear Log</button>
        </div>
        
        <div class="hint">
          <p>💡 <strong>Tip:</strong> Use built-in Eruda "Network" tab for detailed request inspection.</p>
          <p>This tab provides analytics & HAR export functionality.</p>
        </div>
      </div>
    `;

    this.attachStyles($el);
    this.attachHandlers($el);
    this.startMonitoring();
  }

  private attachStyles($root: HTMLElement) {
    const style = document.createElement('style');
    style.textContent = `
      .network-monitor {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .stat-card {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .stat-label {
        font-size: 10px;
        color: #aaa;
        text-align: center;
      }
      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: #667eea;
      }
      .hint {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        border-left: 3px solid #667eea;
      }
      .hint p {
        margin: 0;
        font-size: 11px;
        color: #aaa;
        line-height: 1.5;
      }
      .hint p:not(:last-child) {
        margin-bottom: 6px;
      }
      .hint strong {
        color: #fff;
      }
    `;
    $root.appendChild(style);
  }

  private attachHandlers($root: HTMLElement) {
    $root.querySelector('#export-har-btn')?.addEventListener('click', () => {
      this.exportHAR();
    });

    $root.querySelector('#clear-log-btn')?.addEventListener('click', () => {
      if (confirm('Clear all network logs?')) {
        this.clearLog();
      }
    });
  }

  private startMonitoring() {
    // Update stats every second
    setInterval(() => {
      this.updateStats();
    }, 1000);
  }

  private updateStats() {
    // Read from localStorage (populated by interceptors)
    try {
      const log = JSON.parse(localStorage.getItem('pplx-network-log') || '[]');
      this.stats.totalRequests = log.length;

      if (log.length > 0) {
        const latencies = log.map((entry: any) => entry.latency || 0);
        this.stats.avgLatency =
          latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length;

        const errors = log.filter((entry: any) => entry.status >= 400).length;
        this.stats.errorRate = (errors / log.length) * 100;
      }

      // Update UI
      const totalEl = document.querySelector('#stat-total');
      const latencyEl = document.querySelector('#stat-latency');
      const errorsEl = document.querySelector('#stat-errors');

      if (totalEl) totalEl.textContent = this.stats.totalRequests.toString();
      if (latencyEl) latencyEl.textContent = `${Math.round(this.stats.avgLatency)}ms`;
      if (errorsEl) errorsEl.textContent = `${this.stats.errorRate.toFixed(1)}%`;
    } catch (e) {
      console.error('[Network] Failed to update stats:', e);
    }
  }

  private exportHAR() {
    try {
      const log = JSON.parse(localStorage.getItem('pplx-network-log') || '[]');

      const har = {
        log: {
          version: '1.2',
          creator: {
            name: 'Perplexity DevTool',
            version: '1.0.0',
          },
          entries: log.map((entry: any) => ({
            startedDateTime: entry.timestamp || new Date().toISOString(),
            time: entry.latency || 0,
            request: {
              method: entry.method || 'GET',
              url: entry.url || '',
              httpVersion: 'HTTP/1.1',
              headers: [],
              queryString: [],
              cookies: [],
              headersSize: -1,
              bodySize: -1,
            },
            response: {
              status: entry.status || 0,
              statusText: '',
              httpVersion: 'HTTP/1.1',
              headers: [],
              cookies: [],
              content: {
                size: JSON.stringify(entry.data || {}).length,
                mimeType: 'application/json',
                text: JSON.stringify(entry.data || {}),
              },
              redirectURL: '',
              headersSize: -1,
              bodySize: -1,
            },
            cache: {},
            timings: {
              send: 0,
              wait: entry.latency || 0,
              receive: 0,
            },
          })),
        },
      };

      const blob = new Blob([JSON.stringify(har, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perplexity-${Date.now()}.har`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${(error as Error).message}`);
    }
  }

  private clearLog() {
    localStorage.removeItem('pplx-network-log');
    this.stats = { totalRequests: 0, avgLatency: 0, errorRate: 0 };
    this.updateStats();
  }
}
