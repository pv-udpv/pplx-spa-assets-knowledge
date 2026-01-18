/**
 * Asset parser for Perplexity AI SPA static resources
 */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { AssetMetadata, ParsedAsset, AssetChunk, ExtractedType, APIEndpoint } from '../types/index.js';

export class AssetParser {
  private readonly sourceUrl: string;

  constructor(sourceUrl: string = 'https://pplx-next-static-public.perplexity.ai') {
    this.sourceUrl = sourceUrl;
  }

  /**
   * Parse asset file and extract structured information
   */
  async parseAsset(filePath: string): Promise<ParsedAsset> {
    const content = await readFile(filePath, 'utf-8');
    const metadata = await this.extractMetadata(filePath, content);
    
    const chunks = this.chunkifyAsset(content, filePath);
    const extractedTypes = this.extractTypes(chunks);
    const apiEndpoints = this.extractAPIEndpoints(chunks);

    return {
      metadata,
      chunks,
      extractedTypes,
      apiEndpoints,
    };
  }

  /**
   * Extract metadata from asset
   */
  private async extractMetadata(filePath: string, content: string): Promise<AssetMetadata> {
    const hash = createHash('sha256').update(content).digest('hex');
    const contentType = this.detectContentType(filePath);

    return {
      url: `${this.sourceUrl}/${filePath}`,
      hash,
      size: Buffer.byteLength(content, 'utf-8'),
      contentType,
      fetchedAt: new Date(),
    };
  }

  /**
   * Split asset into logical chunks for analysis
   */
  private chunkifyAsset(content: string, filePath: string): AssetChunk[] {
    const chunks: AssetChunk[] = [];
    const lines = content.split('\n');
    const type = this.detectContentType(filePath);

    // Simple chunking strategy: split by top-level declarations
    // TODO: Implement AST-based chunking for better accuracy
    let currentChunk: string[] = [];
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';
      currentChunk.push(line);

      // Chunk boundary detection (simplified)
      if (this.isChunkBoundary(line, type)) {
        chunks.push({
          id: `chunk_${chunks.length}`,
          type: type as AssetChunk['type'],
          content: currentChunk.join('\n'),
          startLine,
          endLine: i,
          symbols: [], // TODO: Extract symbols from chunk
        });
        currentChunk = [];
        startLine = i + 1;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({
        id: `chunk_${chunks.length}`,
        type: type as AssetChunk['type'],
        content: currentChunk.join('\n'),
        startLine,
        endLine: lines.length - 1,
        symbols: [],
      });
    }

    return chunks;
  }

  /**
   * Extract TypeScript types and interfaces
   */
  private extractTypes(chunks: AssetChunk[]): ExtractedType[] {
    const types: ExtractedType[] = [];
    // TODO: Implement TypeScript AST parsing
    // Use @typescript/vfs or ts-morph for accurate extraction
    return types;
  }

  /**
   * Extract API endpoints from code
   */
  private extractAPIEndpoints(chunks: AssetChunk[]): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];
    // TODO: Detect fetch calls, axios requests, WebSocket connections
    // Pattern matching for common API patterns
    return endpoints;
  }

  private detectContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'json': 'json',
      'css': 'css',
      'html': 'html',
    };
    return typeMap[ext || ''] || 'text';
  }

  private isChunkBoundary(line: string, type: string): boolean {
    const trimmed = line.trim();
    
    if (type === 'typescript' || type === 'javascript') {
      // Detect function/class/interface declarations
      return (
        trimmed.startsWith('export function') ||
        trimmed.startsWith('export class') ||
        trimmed.startsWith('export interface') ||
        trimmed.startsWith('export type') ||
        trimmed.startsWith('export const')
      );
    }

    return false;
  }
}
