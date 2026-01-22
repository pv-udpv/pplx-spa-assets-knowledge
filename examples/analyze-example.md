# Analyze Command Examples

The `analyze` command allows you to analyze local TypeScript/JavaScript files without needing to fetch them from a CDN.

## Basic Usage

### Analyze a Single File

```bash
npm run analyze -- --file ./src/api/users.ts
```

Output:
```
🔍 Analyzing local files...
════════════════════════════════════════════════════════════
📄 Single file mode: ./src/api/users.ts

📝 Analyzing: /path/to/src/api/users.ts
   ✓ Types: 2
   ✓ Symbols: 3
   ✓ Endpoints: 1

✅ Analysis complete:
   Files analyzed: 1
   Total types: 2
   Total symbols: 3
   Total endpoints: 1
   Output: analysis-output/analysis-results.json
```

### Analyze a Directory

```bash
npm run analyze -- --dir ./src
```

This will analyze all `.ts` and `.js` files in the `./src` directory (non-recursive by default).

### Recursive Directory Analysis

```bash
npm run analyze -- --dir ./src --recursive
```

Analyzes all TypeScript/JavaScript files in `./src` and its subdirectories.

### Custom File Pattern

```bash
# Only TypeScript files
npm run analyze -- --dir ./src --pattern "*.ts" --recursive

# TypeScript and TSX files
npm run analyze -- --dir ./src --pattern "*.{ts,tsx}" --recursive

# Only JavaScript files
npm run analyze -- --dir ./src --pattern "*.js" --recursive
```

### Custom Output Directory

```bash
npm run analyze -- --file ./api.ts --output ./my-analysis
```

Results will be saved to `./my-analysis/analysis-results.json`.

## Example Scenario: Analyzing Uploaded Code

Suppose you receive a TypeScript file from a user and want to analyze its structure:

```typescript
// user-upload.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

export async function getProduct(productId: string): Promise<Product> {
  const response = await fetch(`https://api.example.com/products/${productId}`, {
    method: 'GET',
  });
  return response.json();
}

export class ProductService {
  async createProduct(product: Product): Promise<Product> {
    return fetch('https://api.example.com/products', {
      method: 'POST',
    }).then(r => r.json());
  }
}
```

Run:
```bash
npm run analyze -- --file user-upload.ts
```

Generated output (`analysis-output/analysis-results.json`):
```json
[
  {
    "file": "/path/to/user-upload.ts",
    "types": [
      {
        "name": "Product",
        "kind": "interface",
        "properties": [
          { "name": "id", "type": "string", "optional": false, "readonly": false },
          { "name": "name", "type": "string", "optional": false, "readonly": false },
          { "name": "price", "type": "number", "optional": false, "readonly": false },
          { "name": "inStock", "type": "boolean", "optional": false, "readonly": false }
        ],
        "extends": []
      },
      {
        "name": "ProductService",
        "kind": "class",
        "properties": [],
        "methods": [
          {
            "name": "createProduct",
            "parameters": [
              { "name": "product", "type": "Product", "optional": false }
            ],
            "returnType": "Promise<Product>",
            "async": true
          }
        ]
      }
    ],
    "symbols": [
      { "name": "Product", "kind": "interface", "exported": true, "location": {...} },
      { "name": "getProduct", "kind": "function", "exported": true, "location": {...} },
      { "name": "ProductService", "kind": "class", "exported": true, "location": {...} }
    ],
    "endpoints": [
      {
        "path": "https://api.example.com/products/${productId}",
        "method": "GET"
      }
    ]
  }
]
```

## Use Cases

1. **Code Review**: Analyze uploaded code to understand its structure before reviewing
2. **Documentation Generation**: Extract types and interfaces from code
3. **API Discovery**: Identify API endpoints used in the code
4. **Migration Analysis**: Understand the structure of legacy code before migration
5. **Security Audit**: Identify external API calls and data structures

## Integration with Other Commands

The output from `analyze` can be used as input to other commands:

```bash
# 1. Analyze local files
npm run analyze -- --dir ./src --output ./analysis

# 2. Generate OpenAPI spec from analyzed code
npm run generate -- --input ./analysis --type openapi

# 3. Build knowledge base
npm run kb:build -- --input ./analysis --output ./kb
```

## Advanced Options

```bash
# Analyze multiple patterns
npm run analyze -- --dir ./src --pattern "*.{ts,tsx,js,jsx}" --recursive

# Analyze with specific output location
npm run analyze -- \
  --dir ./my-project/src \
  --recursive \
  --pattern "*.ts" \
  --output ./reports/$(date +%Y%m%d)
```

## Limitations

- Only detects fetch calls at the function level (not inside class methods currently shown in endpoints)
- Pattern matching is simple (no full glob support like `**/*.ts`)
- Large files (>10MB) may take longer to parse
- Requires valid TypeScript/JavaScript syntax

## Tips

- Use `--recursive` for deep directory structures
- Use specific patterns to avoid analyzing unnecessary files (e.g., `node_modules`)
- Check the output JSON for detailed analysis results
- Combine with `jq` for querying specific parts: `cat analysis-output/analysis-results.json | jq '.[] | .types'`
