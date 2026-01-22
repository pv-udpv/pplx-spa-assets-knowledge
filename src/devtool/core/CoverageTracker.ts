export interface EndpointCoverage {
  called: boolean;
  callCount: number;
  lastCalled: string | null;
  lastStatus: number | null;
  avgLatency: number;
}

export interface CoverageStats {
  total: number;
  called: number;
  coverage: number;
}

export class CoverageTracker {
  private coverage: Record<string, Record<string, EndpointCoverage>> = {};
  private storageKey = 'pplx-api-coverage';

  constructor() {
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.coverage = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[Coverage] Failed to load:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.coverage));
    } catch (e) {
      console.error('[Coverage] Failed to save:', e);
    }
  }

  initCategory(category: string, endpoints: Array<{ method: string; path: string }>) {
    if (!this.coverage[category]) {
      this.coverage[category] = {};
    }

    for (const endpoint of endpoints) {
      const key = `${endpoint.method} ${endpoint.path}`;
      if (!this.coverage[category][key]) {
        this.coverage[category][key] = {
          called: false,
          callCount: 0,
          lastCalled: null,
          lastStatus: null,
          avgLatency: 0,
        };
      }
    }

    this.save();
  }

  markCalled(method: string, path: string, status: number, latency?: number) {
    // Find category
    let category = 'other';
    for (const cat in this.coverage) {
      const key = `${method} ${path}`;
      if (this.coverage[cat][key]) {
        category = cat;
        break;
      }
    }

    const key = `${method} ${path}`;
    if (!this.coverage[category]) {
      this.coverage[category] = {};
    }

    if (!this.coverage[category][key]) {
      this.coverage[category][key] = {
        called: false,
        callCount: 0,
        lastCalled: null,
        lastStatus: null,
        avgLatency: 0,
      };
    }

    const entry = this.coverage[category][key];
    entry.called = true;
    entry.callCount++;
    entry.lastCalled = new Date().toISOString();
    entry.lastStatus = status;

    if (latency !== undefined) {
      // Running average
      entry.avgLatency =
        (entry.avgLatency * (entry.callCount - 1) + latency) / entry.callCount;
    }

    this.save();
  }

  getStats(): Record<string, CoverageStats> {
    const stats: Record<string, CoverageStats> = {};

    for (const [category, endpoints] of Object.entries(this.coverage)) {
      const total = Object.keys(endpoints).length;
      const called = Object.values(endpoints).filter((e) => e.called).length;
      const coverage = total > 0 ? Math.round((called / total) * 100) : 0;

      stats[category] = { total, called, coverage };
    }

    return stats;
  }

  getCoverage(): Record<string, Record<string, EndpointCoverage>> {
    return this.coverage;
  }

  reset() {
    this.coverage = {};
    this.save();
  }
}
