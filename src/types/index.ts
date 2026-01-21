/**
 * Core type definitions for asset parsing and specification generation
 */

export interface AssetMetadata {
  url: string;
  hash: string;
  size: number;
  contentType: string;
  fetchedAt: Date;
  version?: string;
}

export interface ParsedAsset {
  metadata: AssetMetadata;
  chunks: AssetChunk[];
  extractedTypes: ExtractedType[];
  apiEndpoints: APIEndpoint[];
}

export interface AssetChunk {
  id: string;
  type: 'javascript' | 'typescript' | 'json' | 'css' | 'html';
  content: string;
  startLine: number;
  endLine: number;
  symbols: Symbol[];
}

export interface Symbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum';
  exported: boolean;
  location: SourceLocation;
}

export interface SourceLocation {
  line: number;
  column: number;
  file: string;
}

export interface ExtractedType {
  name: string;
  kind: 'interface' | 'type' | 'class' | 'enum';
  properties?: TypeProperty[];
  methods?: TypeMethod[];
  extends?: string[];
  implements?: string[];
}

export interface TypeProperty {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  description?: string;
}

export interface TypeMethod {
  name: string;
  parameters: MethodParameter[];
  returnType: string;
  async: boolean;
}

export interface MethodParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS';
  requestType?: string;
  responseType?: string;
  description?: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  type: 'entity' | 'relationship' | 'concept';
  content: string;
  metadata: Record<string, unknown>;
  embeddings?: number[];
  references: string[];
}

export interface SpecGenerationConfig {
  title: string;
  version: string;
  description: string;
  baseUrl?: string;
  servers?: ServerConfig[];
}

export interface ServerConfig {
  url: string;
  description: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  enum?: string[];
  description?: string;
}

/**
 * Browser capture types
 */

export interface CaptureConfig {
  timeout: number;
  headless: boolean;
  capture: {
    har: boolean;
    network: boolean;
    websocket: boolean;
    sse: boolean;
    callstack: boolean;
    storage: boolean;
    cookies: boolean;
    console: boolean;
    domSnapshot: boolean;
    performance: boolean;
  };
  chrome: {
    port: number;
    host: string;
    executable?: string;
  };
  extension: {
    enabled: boolean;
    path: string;
    autoLoad: boolean;
  };
  output: {
    dir: string;
    format: 'json' | 'jsonl' | 'har';
    compress: boolean;
  };
}

export interface CaptureData {
  timestamp: string;
  url: string;
  har: {
    log: {
      version: string;
      creator: { name: string; version: string };
      entries: Record<string, unknown>[];
    };
  };
  websocketMessages: Array<{ type: string; data: unknown; timestamp: number }>;
  eventStreamEvents: Array<{ event: string; data: unknown; timestamp: number }>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: Array<{ name: string; value: string; domain: string; path: string; secure: boolean; httpOnly: boolean }>;
  callstacks: Array<Array<{ functionName: string; scriptId: string; url: string; lineNumber: number; columnNumber: number }>>;
  console: Array<{ type: string; timestamp: string; arguments: unknown[] }>;
  networkTimings: Record<string, number>;
}

export interface BrowserSession {
  id: string;
  config: CaptureConfig;
  startTime: Date;
  endTime?: Date;
  captures: CaptureData[];
  tasks: Array<{ name: string; duration: number; success: boolean; error?: string }>;
}
