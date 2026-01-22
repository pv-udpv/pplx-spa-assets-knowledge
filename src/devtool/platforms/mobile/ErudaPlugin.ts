import type { Eruda, ErudaPlugin } from '../../types/eruda';

export class PerplexityDevTool implements ErudaPlugin {
  name = 'Perplexity';

  init($el: HTMLElement, eruda: Eruda) {
    $el.innerHTML = `
      <div class="pplx-devtool">
        <div class="pplx-tabs">
          <button class="pplx-tab active" data-tab="api">API</button>
          <button class="pplx-tab" data-tab="schema">Schema</button>
          <button class="pplx-tab" data-tab="network">Network+</button>
          <button class="pplx-tab" data-tab="settings">Settings</button>
        </div>
        <div class="pplx-content">
          <div class="pplx-tab-content active" id="tab-api">
            <h3>API Explorer</h3>
            <p>Coming soon...</p>
          </div>
          <div class="pplx-tab-content" id="tab-schema">
            <h3>Schema Inspector</h3>
            <p>Coming soon...</p>
          </div>
          <div class="pplx-tab-content" id="tab-network">
            <h3>Network Monitor</h3>
            <p>Coming soon...</p>
          </div>
          <div class="pplx-tab-content" id="tab-settings">
            <h3>Settings</h3>
            <p>Coming soon...</p>
          </div>
        </div>
      </div>
    `;

    this.attachStyles($el);
    this.attachTabHandlers($el);
  }

  private attachStyles($root: HTMLElement) {
    const style = document.createElement('style');
    style.textContent = `
      .pplx-devtool {
        padding: 16px;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .pplx-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
      }
      .pplx-tab {
        background: transparent;
        border: none;
        color: #aaa;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
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
      .pplx-tab-content h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #667eea;
      }
    `;
    $root.appendChild(style);
  }

  private attachTabHandlers($root: HTMLElement) {
    $root.querySelectorAll('.pplx-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).dataset.tab;
        this.switchTab($root, target!);
      });
    });
  }

  private switchTab($root: HTMLElement, tab: string) {
    $root.querySelectorAll('.pplx-tab').forEach(t => t.classList.remove('active'));
    $root.querySelectorAll('.pplx-tab-content').forEach(c => c.classList.remove('active'));

    $root.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    $root.querySelector(`#tab-${tab}`)?.classList.add('active');
  }
}
