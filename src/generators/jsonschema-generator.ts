/**
 * JSON Schema generator for extracted types
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ExtractedType } from '../types/index.js';

export interface JSONSchemaObject {
  $schema: string;
  $id?: string;
  title: string;
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  definitions?: Record<string, JSONSchemaObject>;
}

export interface JSONSchemaProperty {
  type: string | string[];
  description?: string;
  format?: string;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  $ref?: string;
}

export class JSONSchemaGenerator {
  /**
   * Generate JSON Schema from extracted TypeScript types
   */
  async generate(types: ExtractedType[], outputDir: string): Promise<void> {
    await mkdir(outputDir, { recursive: true });

    for (const type of types) {
      const schema = this.typeToSchema(type);
      const filePath = `${outputDir}/${type.name}.schema.json`;
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(schema, null, 2), 'utf-8');
    }
  }

  private typeToSchema(type: ExtractedType): JSONSchemaObject {
    const properties: Record<string, JSONSchemaProperty> = {};
    const required: string[] = [];

    if (type.properties) {
      for (const prop of type.properties) {
        properties[prop.name] = {
          type: this.mapTypeToJSONSchema(prop.type),
          description: prop.description,
        };

        if (!prop.optional) {
          required.push(prop.name);
        }
      }
    }

    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: `https://perplexity.ai/schemas/${type.name}.json`,
      title: type.name,
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  private mapTypeToJSONSchema(tsType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'object': 'object',
      'array': 'array',
      'null': 'null',
    };

    // Handle union types
    if (tsType.includes('|')) {
      return 'string'; // Simplified, should return array of types
    }

    // Handle array types
    if (tsType.endsWith('[]')) {
      return 'array';
    }

    return typeMap[tsType.toLowerCase()] || 'string';
  }
}
