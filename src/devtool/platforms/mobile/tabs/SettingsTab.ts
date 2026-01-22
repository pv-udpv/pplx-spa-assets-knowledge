import { Storage } from '../../../core/Storage';

export class SettingsTab {
  private storage = new Storage();

  mount($el: HTMLElement) {
    const config = this.loadConfig();

    $el.innerHTML = `
      <div class="settings">
        <div class="setting-group">
          <h4>🔐 GitHub Integration</h4>
          <label>
            <span>Personal Access Token</span>
            <input type="password" id="github-pat" placeholder="ghp_xxxxx" value="${config.githubPAT || ''}">
          </label>
          <label>
            <span>Repository</span>
            <input type="text" id="github-repo" value="${config.githubRepo || 'pv-udpv/pplx-spa-assets-knowledge'}" readonly>
          </label>
          <label class="checkbox">
            <input type="checkbox" id="auto-sync" ${config.autoSync ? 'checked' : ''}>
            <span>Auto-sync captures to GitHub</span>
          </label>
        </div>
        
        <div class="setting-group">
          <h4>⚙️ Capture Settings</h4>
          <label class="checkbox">
            <input type="checkbox" id="capture-fetch" ${config.captureFetch !== false ? 'checked' : ''}>
            <span>Intercept fetch() requests</span>
          </label>
          <label class="checkbox">
            <input type="checkbox" id="capture-xhr" ${config.captureXHR !== false ? 'checked' : ''}>
            <span>Intercept XMLHttpRequest</span>
          </label>
          <label class="checkbox">
            <input type="checkbox" id="capture-ws" ${config.captureWS ? 'checked' : ''}>
            <span>Intercept WebSocket (experimental)</span>
          </label>
        </div>
        
        <div class="setting-group">
          <h4>🎨 UI Settings</h4>
          <label>
            <span>Button Position</span>
            <button id="reset-position-btn" class="action-btn">Reset Position</button>
          </label>
        </div>
        
        <div class="actions">
          <button id="save-btn" class="action-btn primary">💾 Save Settings</button>
          <button id="reset-btn" class="action-btn danger">🔄 Reset All</button>
        </div>
        
        <div class="info">
          <p><strong>DevTool Version:</strong> 1.0.0</p>
          <p><strong>Eruda Version:</strong> 3.0.1</p>
          <p><strong>Build:</strong> vite-plugin-monkey</p>
        </div>
      </div>
    `;

    this.attachStyles($el);
    this.attachHandlers($el);
  }

  private attachStyles($root: HTMLElement) {
    const style = document.createElement('style');
    style.textContent = `
      .settings {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .setting-group {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      .setting-group h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #667eea;
      }
      .setting-group label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
        font-size: 12px;
      }
      .setting-group label:last-child {
        margin-bottom: 0;
      }
      .setting-group label span {
        color: #aaa;
      }
      .setting-group input[type="text"],
      .setting-group input[type="password"] {
        padding: 8px;
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 4px;
        color: #fff;
        font-size: 12px;
      }
      .setting-group label.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 8px;
      }
      .setting-group input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      .info {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        font-size: 11px;
        color: #aaa;
      }
      .info p {
        margin: 0;
        padding: 4px 0;
      }
      .info strong {
        color: #fff;
      }
    `;
    $root.appendChild(style);
  }

  private attachHandlers($root: HTMLElement) {
    $root.querySelector('#save-btn')?.addEventListener('click', () => {
      this.saveConfig();
    });

    $root.querySelector('#reset-btn')?.addEventListener('click', () => {
      if (confirm('Reset all settings to default?')) {
        this.resetConfig();
      }
    });

    $root.querySelector('#reset-position-btn')?.addEventListener('click', () => {
      localStorage.removeItem('pplx-sticky-btn-position');
      alert('Button position reset. Refresh page to apply.');
    });
  }

  private loadConfig() {
    return {
      githubPAT: this.storage.get<string>('github-pat', ''),
      githubRepo: this.storage.get<string>('github-repo', 'pv-udpv/pplx-spa-assets-knowledge'),
      autoSync: this.storage.get<boolean>('auto-sync', false),
      captureFetch: this.storage.get<boolean>('capture-fetch', true),
      captureXHR: this.storage.get<boolean>('capture-xhr', true),
      captureWS: this.storage.get<boolean>('capture-ws', false),
    };
  }

  private saveConfig() {
    const pat = (document.querySelector('#github-pat') as HTMLInputElement).value;
    const autoSync = (document.querySelector('#auto-sync') as HTMLInputElement).checked;
    const captureFetch = (document.querySelector('#capture-fetch') as HTMLInputElement).checked;
    const captureXHR = (document.querySelector('#capture-xhr') as HTMLInputElement).checked;
    const captureWS = (document.querySelector('#capture-ws') as HTMLInputElement).checked;

    this.storage.set('github-pat', pat);
    this.storage.set('auto-sync', autoSync);
    this.storage.set('capture-fetch', captureFetch);
    this.storage.set('capture-xhr', captureXHR);
    this.storage.set('capture-ws', captureWS);

    alert('✅ Settings saved!');
  }

  private resetConfig() {
    this.storage.clear();
    alert('✅ Settings reset. Refresh page to apply.');
  }
}
