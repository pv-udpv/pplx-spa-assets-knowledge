/**
 * Knowledge base builder from parsed assets
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ParsedAsset, KnowledgeBaseEntry } from '../types/index.js';

export interface KnowledgeBase {
  version: string;
  generatedAt: Date;
  entries: KnowledgeBaseEntry[];
  statistics: {
    totalAssets: number;
    totalTypes: number;
    totalEndpoints: number;
    totalEntities: number;
  };
}

export class KnowledgeBaseBuilder {
  private entries: KnowledgeBaseEntry[] = [];

  /**
   * Build knowledge base from parsed assets
   */
  async build(assets: ParsedAsset[], outputDir: string): Promise<KnowledgeBase> {
    await mkdir(outputDir, { recursive: true });

    for (const asset of assets) {
      this.processAsset(asset);
    }

    const kb: KnowledgeBase = {
      version: '1.0.0',
      generatedAt: new Date(),
      entries: this.entries,
      statistics: {
        totalAssets: assets.length,
        totalTypes: assets.reduce((sum, a) => sum + a.extractedTypes.length, 0),
        totalEndpoints: assets.reduce((sum, a) => sum + a.apiEndpoints.length, 0),
        totalEntities: this.entries.filter(e => e.type === 'entity').length,
      },
    };

    await this.saveKnowledgeBase(kb, outputDir);
    return kb;
  }

  private processAsset(asset: ParsedAsset): void {
    // Create entity entries for types
    for (const type of asset.extractedTypes) {
      this.entries.push({
        id: `type_${type.name}`,
        type: 'entity',
        content: JSON.stringify(type),
        metadata: {
          kind: type.kind,
          source: asset.metadata.url,
        },
        references: [],
      });
    }

    // Create entity entries for endpoints
    for (const endpoint of asset.apiEndpoints) {
      this.entries.push({
        id: `endpoint_${endpoint.method}_${endpoint.path}`,
        type: 'entity',
        content: JSON.stringify(endpoint),
        metadata: {
          method: endpoint.method,
          path: endpoint.path,
          source: asset.metadata.url,
        },
        references: [],
      });
    }

    // TODO: Extract relationships between entities
    // TODO: Generate embeddings for semantic search
  }

  private async saveKnowledgeBase(kb: KnowledgeBase, outputDir: string): Promise<void> {
    // Save main KB file
    await writeFile(
      join(outputDir, 'knowledge-base.json'),
      JSON.stringify(kb, null, 2),
      'utf-8'
    );

    // Save entities separately
    const entitiesDir = join(outputDir, 'entities');
    await mkdir(entitiesDir, { recursive: true });

    for (const entry of kb.entries.filter(e => e.type === 'entity')) {
      await writeFile(
        join(entitiesDir, `${entry.id}.json`),
        JSON.stringify(entry, null, 2),
        'utf-8'
      );
    }
  }
}
