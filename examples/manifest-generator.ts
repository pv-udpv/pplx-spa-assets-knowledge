#!/usr/bin/env node
/**
 * Generate manifest.txt from Perplexity AI HTML
 * Usage: npx ts-node examples/manifest-generator.ts <html-file>
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function generateManifest(htmlPath: string): Promise<void> {
  console.log('📄 Parsing HTML to extract asset paths...');
  const htmlContent = await readFile(htmlPath, 'utf-8');

  const assetPaths = new Set<string>();

  // Script tags: <script src="...">  
  const scriptMatches = htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
  for (const match of scriptMatches) {
    if (match[1]) assetPaths.add(match[1]);
  }

  // Link tags: <link rel="stylesheet" href="...">
  const linkMatches = htmlContent.matchAll(/<link[^>]+href=["']([^"']+)["']/g);
  for (const match of linkMatches) {
    if (match[1]) assetPaths.add(match[1]);
  }

  // Inline imports in scripts (basic pattern)
  const importMatches = htmlContent.matchAll(
    /import\s+.*?from\s+["']([^"']+)["']/g
  );
  for (const match of importMatches) {
    if (match[1]) assetPaths.add(match[1]);
  }

  // Next.js specific patterns
  const nextMatches = htmlContent.matchAll(
    /["']([/_][^"']*\.(?:js|css))["']/g
  );
  for (const match of nextMatches) {
    if (match[1]) assetPaths.add(match[1]);
  }

  // Write manifest
  const manifest = Array.from(assetPaths)
    .filter(path => path && !path.startsWith('http'))
    .sort()
    .join('\n');

  const outputPath = 'manifest.txt';
  await writeFile(outputPath, manifest, 'utf-8');

  console.log(`✅ Manifest generated: ${outputPath}`);
  console.log(`   Found ${assetPaths.size} unique asset paths`);
  console.log('');
  console.log('Sample paths:');
  Array.from(assetPaths)
    .slice(0, 10)
    .forEach(path => console.log(`   ${path}`));
}

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('❌ Usage: npx ts-node examples/manifest-generator.ts <html-file>');
  process.exit(1);
}

generatManifest(resolve(htmlPath)).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
