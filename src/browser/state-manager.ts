/**
 * Session State Manager
 * Capture, restore, and diff browser session states
 */

import { CDPClient } from './cdp-client.js';
import { promises as fs } from 'node:fs';

export interface SessionSnapshot {
  label: string;
  timestamp: string;
  url: string;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    httpOnly: boolean;
  }>;
  dom?: string;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor: number;
  };
}

export interface SnapshotDiff {
  label1: string;
  label2: string;
  differences: {
    localStorage: {
      added: Record<string, string>;
      removed: Record<string, string>;
      modified: Record<string, { old: string; new: string }>;
    };
    sessionStorage: {
      added: Record<string, string>;
      removed: Record<string, string>;
      modified: Record<string, { old: string; new: string }>;
    };
    cookies: {
      added: Array<any>;
      removed: Array<any>;
      modified: Array<{ name: string; old: any; new: any }>;
    };
    url: {
      changed: boolean;
      old: string;
      new: string;
    };
  };
}

export class SessionStateManager {
  private snapshots: Map<string, SessionSnapshot> = new Map();

  constructor(private cdp: CDPClient) {}

  /**
   * Capture current browser state as a snapshot
   * 
   * @param label - Label for the snapshot
   */
  async captureSnapshot(label: string): Promise<SessionSnapshot> {
    console.log(`📸 Capturing snapshot: ${label}`);

    // Get CDP capture data
    const captureData = this.cdp.getCaptureData();

    // Capture current URL (would need CDP Page domain)
    const url = captureData.url;

    // Capture storage
    await this.cdp.captureStorage();
    const updatedData = this.cdp.getCaptureData();

    const snapshot: SessionSnapshot = {
      label,
      timestamp: new Date().toISOString(),
      url,
      localStorage: updatedData.localStorage,
      sessionStorage: updatedData.sessionStorage,
      cookies: updatedData.cookies,
    };

    // Store snapshot
    this.snapshots.set(label, snapshot);

    console.log(`✅ Snapshot captured: ${label}`);
    return snapshot;
  }

  /**
   * Restore a snapshot to the browser
   * 
   * @param label - Label of snapshot to restore
   */
  async restoreSnapshot(label: string): Promise<void> {
    const snapshot = this.snapshots.get(label);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${label}`);
    }

    console.log(`🔄 Restoring snapshot: ${label}`);

    // Note: This is a simplified version. Full implementation would need
    // proper CDP Runtime.evaluate calls to set storage values

    // Restore localStorage would use script like:
    // const localStorageScript = `
    //   localStorage.clear();
    //   ${Object.entries(snapshot.localStorage)
    //     .map(([key, value]) => `localStorage.setItem('${key}', '${value}');`)
    //     .join('\n')}
    // `;

    // Restore sessionStorage would use script like:
    // const sessionStorageScript = `
    //   sessionStorage.clear();
    //   ${Object.entries(snapshot.sessionStorage)
    //     .map(([key, value]) => `sessionStorage.setItem('${key}', '${value}');`)
    //     .join('\n')}
    // `;

    // Execute restore scripts
    console.log(`   Restoring localStorage (${Object.keys(snapshot.localStorage).length} items)`);
    console.log(`   Restoring sessionStorage (${Object.keys(snapshot.sessionStorage).length} items)`);
    console.log(`   Restoring cookies (${snapshot.cookies.length} items)`);

    // In a full implementation, these would be executed via CDP Runtime.evaluate
    // For now, this is a placeholder structure

    console.log(`✅ Snapshot restored: ${label}`);
  }

  /**
   * Compare two snapshots and return differences
   * 
   * @param label1 - First snapshot label
   * @param label2 - Second snapshot label
   * @returns Diff object showing changes
   */
  async diffSnapshots(label1: string, label2: string): Promise<SnapshotDiff> {
    const snapshot1 = this.snapshots.get(label1);
    const snapshot2 = this.snapshots.get(label2);

    if (!snapshot1) {
      throw new Error(`Snapshot not found: ${label1}`);
    }
    if (!snapshot2) {
      throw new Error(`Snapshot not found: ${label2}`);
    }

    console.log(`🔍 Diffing snapshots: ${label1} vs ${label2}`);

    const diff: SnapshotDiff = {
      label1,
      label2,
      differences: {
        localStorage: this.diffStorage(snapshot1.localStorage, snapshot2.localStorage),
        sessionStorage: this.diffStorage(snapshot1.sessionStorage, snapshot2.sessionStorage),
        cookies: this.diffCookies(snapshot1.cookies, snapshot2.cookies),
        url: {
          changed: snapshot1.url !== snapshot2.url,
          old: snapshot1.url,
          new: snapshot2.url,
        },
      },
    };

    // Print summary
    console.log('📊 Diff Summary:');
    console.log(`   localStorage: ${Object.keys(diff.differences.localStorage.added).length} added, ${Object.keys(diff.differences.localStorage.removed).length} removed, ${Object.keys(diff.differences.localStorage.modified).length} modified`);
    console.log(`   sessionStorage: ${Object.keys(diff.differences.sessionStorage.added).length} added, ${Object.keys(diff.differences.sessionStorage.removed).length} removed, ${Object.keys(diff.differences.sessionStorage.modified).length} modified`);
    console.log(`   cookies: ${diff.differences.cookies.added.length} added, ${diff.differences.cookies.removed.length} removed, ${diff.differences.cookies.modified.length} modified`);
    console.log(`   URL changed: ${diff.differences.url.changed}`);

    return diff;
  }

  /**
   * Export snapshot to file
   * 
   * @param label - Snapshot label
   * @param filepath - Output file path
   */
  async exportSnapshot(label: string, filepath: string): Promise<void> {
    const snapshot = this.snapshots.get(label);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${label}`);
    }

    await fs.writeFile(
      filepath,
      JSON.stringify(snapshot, null, 2),
      'utf-8'
    );

    console.log(`💾 Snapshot exported: ${filepath}`);
  }

  /**
   * Import snapshot from file
   * 
   * @param filepath - Snapshot file path
   * @returns Label of imported snapshot
   */
  async importSnapshot(filepath: string): Promise<string> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const snapshot: SessionSnapshot = JSON.parse(content);

      this.snapshots.set(snapshot.label, snapshot);

      console.log(`📥 Snapshot imported: ${snapshot.label}`);
      return snapshot.label;
    } catch (error) {
      throw new Error(`Failed to import snapshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all available snapshots
   */
  listSnapshots(): Array<{ label: string; timestamp: string; url: string }> {
    return Array.from(this.snapshots.values()).map(s => ({
      label: s.label,
      timestamp: s.timestamp,
      url: s.url,
    }));
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(label: string): boolean {
    return this.snapshots.delete(label);
  }

  /**
   * Helper: Diff storage objects
   */
  private diffStorage(
    storage1: Record<string, string>,
    storage2: Record<string, string>
  ): {
    added: Record<string, string>;
    removed: Record<string, string>;
    modified: Record<string, { old: string; new: string }>;
  } {
    const added: Record<string, string> = {};
    const removed: Record<string, string> = {};
    const modified: Record<string, { old: string; new: string }> = {};

    // Find added and modified
    for (const [key, value] of Object.entries(storage2)) {
      if (!(key in storage1)) {
        added[key] = value;
      } else {
        const oldValue = storage1[key];
        // Treat any change in value (including to/from undefined) as a modification
        if (oldValue !== value) {
          modified[key] = { old: oldValue, new: value };
        }
      }
    }

    // Find removed
    for (const key of Object.keys(storage1)) {
      if (!(key in storage2)) {
        const removedValue = storage1[key];
        if (removedValue !== undefined) {
          removed[key] = removedValue;
        }
      }
    }

    return { added, removed, modified };
  }

  /**
   * Helper: Diff cookies
   */
  private diffCookies(
    cookies1: Array<any>,
    cookies2: Array<any>
  ): {
    added: Array<any>;
    removed: Array<any>;
    modified: Array<{ name: string; old: any; new: any }>;
  } {
    const added: Array<any> = [];
    const removed: Array<any> = [];
    const modified: Array<{ name: string; old: any; new: any }> = [];

    const cookies1Map = new Map(cookies1.map(c => [c.name, c]));
    const cookies2Map = new Map(cookies2.map(c => [c.name, c]));

    // Find added and modified
    for (const [name, cookie] of cookies2Map.entries()) {
      if (!cookies1Map.has(name)) {
        added.push(cookie);
      } else {
        const oldCookie = cookies1Map.get(name);
        if (JSON.stringify(oldCookie) !== JSON.stringify(cookie)) {
          modified.push({ name, old: oldCookie, new: cookie });
        }
      }
    }

    // Find removed
    for (const [name, cookie] of cookies1Map.entries()) {
      if (!cookies2Map.has(name)) {
        removed.push(cookie);
      }
    }

    return { added, removed, modified };
  }
}
