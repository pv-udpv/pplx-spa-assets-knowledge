export class Storage {
  private prefix = 'pplx-devtool-';

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = localStorage.getItem(this.prefix + key);
      if (value === null) return defaultValue;
      return JSON.parse(value) as T;
    } catch (e) {
      console.error('[Storage] Failed to get:', key, e);
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error('[Storage] Failed to set:', key, e);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {
      console.error('[Storage] Failed to remove:', key, e);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(this.prefix));
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('[Storage] Failed to clear:', e);
    }
  }
}
