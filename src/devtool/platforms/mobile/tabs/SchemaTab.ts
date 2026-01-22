import type { OpenAPIBuilder } from '../../../core/OpenAPIBuilder';

export class SchemaTab {
  private isCapturing = false;

  constructor(private builder: OpenAPIBuilder) {}

  mount($el: HTMLElement) {
    $el.innerHTML = `
      <div class="schema-inspector">
        <div class="actions">
          <button id="capture-btn" class="action-btn">
            📡 <span id="capture-text">Start Capture</span>
          </button>
          <button id="export-btn" class="action-btn">💾 Export OpenAPI</button>
          <button id="diff-btn" class="action-btn">🔍 Diff with Repo</button>
          <button id="clear-btn" class="action-btn danger">🗑️ Clear Schema</button>
        </div>
        
        <div class="schema-tree">
          <h4>🌳 Discovered Endpoints</h4>
          <div id="schema-tree-view"></div>
        </div>
        
        <div class="schema-preview">
          <h4>📋 OpenAPI Preview</h4>
          <pre id="schema-output"></pre>
        </div>
      </div>
    `;

    this.attachStyles($el);
    this.attachHandlers($el);
    this.renderTree($el.querySelector('#schema-tree-view')!);
    this.renderPreview($el.querySelector('#schema-output')!);
  }

  private attachStyles($root: HTMLElement) {
    const style = document.createElement('style');
    style.textContent = `
      .schema-inspector {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
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
      .action-btn.danger {
        background: #f93e3e;
      }
      .action-btn.danger:hover {
        background: #e02929;
      }
      .action-btn.active {
        background: #49cc90;
      }
      .schema-tree, .schema-preview {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      .schema-tree h4, .schema-preview h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #667eea;
      }
      #schema-tree-view {
        max-height: 200px;
        overflow-y: auto;
      }
      .endpoint-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: #1e1e1e;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 11px;
      }
      .badge {
        padding: 2px 6px;
        background: #667eea;
        border-radius: 3px;
        font-size: 10px;
        color: #fff;
      }
      #schema-output {
        margin: 0;
        padding: 10px;
        background: #1a1a1a;
        border-radius: 4px;
        font-size: 10px;
        line-height: 1.4;
        overflow-x: auto;
        max-height: 250px;
        overflow-y: auto;
      }
    `;
    $root.appendChild(style);
  }

  private attachHandlers($root: HTMLElement) {
    $root.querySelector('#capture-btn')?.addEventListener('click', () => {
      this.toggleCapture();
    });

    $root.querySelector('#export-btn')?.addEventListener('click', () => {
      this.exportSchema();
    });

    $root.querySelector('#diff-btn')?.addEventListener('click', () => {
      this.diffWithRepo();
    });

    $root.querySelector('#clear-btn')?.addEventListener('click', () => {
      if (confirm('Clear all captured schema data?')) {
        this.builder.clear();
        const treeView = $root.querySelector('#schema-tree-view');
        const output = $root.querySelector('#schema-output');
        if (treeView instanceof HTMLElement) {
          this.renderTree(treeView);
        }
        if (output instanceof HTMLElement) {
          this.renderPreview(output);
        }
      }
    });
  }

  private toggleCapture() {
    this.isCapturing = !this.isCapturing;
    const btn = document.querySelector('#capture-btn');
    const text = document.querySelector('#capture-text');

    if (!btn || !text) {
      return;
    }

    if (this.isCapturing) {
      btn.classList.add('active');
      text.textContent = 'Stop Capture';
    } else {
      btn.classList.remove('active');
      text.textContent = 'Start Capture';
    }
  }

  private exportSchema() {
    const schema = this.builder.build();

    // Mobile-friendly download
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perplexity-api-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async diffWithRepo() {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/pv-udpv/pplx-spa-assets-knowledge/main/data/openapi.json'
      );

      if (!response.ok) {
        alert('Failed to fetch repo schema');
        return;
      }

      const repoSchema = await response.json();
      const diff = this.builder.diff(repoSchema);

      alert(
        `Schema Diff:\n\n` +
          `✅ Added: ${diff.added.length} endpoints\n` +
          `⚠️ Modified: ${diff.modified.length} endpoints\n` +
          `❌ Removed: ${diff.removed.length} endpoints\n\n` +
          (diff.added.length > 0 ? `\nNew endpoints:\n${diff.added.join('\n')}` : '')
      );
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  }

  private renderTree($el: HTMLElement) {
    const endpoints = this.builder.getEndpoints();

    if (endpoints.length === 0) {
      $el.innerHTML =
        '<p style="color: #aaa; font-size: 12px;">No endpoints captured yet. Browse Perplexity to discover APIs!</p>';
      return;
    }

    $el.innerHTML = endpoints
      .map(
        (ep) => `
        <div class="endpoint-item">
          <span class="method method-${ep.method.toLowerCase()}">${ep.method}</span>
          <span class="path">${ep.path}</span>
          <span class="badge">${ep.responseCount} responses</span>
        </div>
      `
      )
      .join('');
  }

  private renderPreview($el: HTMLElement) {
    const schema = this.builder.build();
    const pathCount = Object.keys(schema.paths).length;

    if (pathCount === 0) {
      $el.textContent = 'No schema data available';
      return;
    }

    $el.textContent = JSON.stringify(schema, null, 2);
  }

  updateFromInterceptor() {
    // Called by main.ts when new requests are captured
    const treeEl = document.querySelector('#schema-tree-view');
    if (treeEl instanceof HTMLElement) {
      this.renderTree(treeEl);
    }

    const outputEl = document.querySelector('#schema-output');
    if (outputEl instanceof HTMLElement) {
      this.renderPreview(outputEl);
    }
  }
}
