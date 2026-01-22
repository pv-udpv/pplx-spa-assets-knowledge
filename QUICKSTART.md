# ⚡ Quick Start — 5 Minutes

## 🎯 What You Get

- **404 REST endpoints** fully cataloged
- **397 app modules** with gzip-compressed source code
- **CLI tool** with 4 analysis commands
- **Ready for Phase 2** expansion (schemas, graphs, flags)

---

## 🚀 Setup (2 min)

```bash
# Clone repo
git clone https://github.com/pv-udpv/pplx-spa-assets-knowledge.git
cd pplx-spa-assets-knowledge

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install (only pyyaml needed)
pip install pyyaml

# Verify
python spec_analyzer.py --help
```

---

## 🔍 Explore the Spec (1 min)

```bash
# View main artifact
ls -lh perplexity_spa_full_spec.json
# Output: 1.9 MB (includes 397 gzipped modules)

# Quick stats
python3 << 'EOF'
import json
with open('perplexity_spa_full_spec.json') as f:
    spec = json.load(f)

print(f"Endpoints: {len(spec['endpoints']['rest'])}")
print(f"Modules: {len(spec['source_codes_meta'])}")
print(f"Categories: {len(spec['endpoints']['rest_by_category'])}")
EOF

# Output:
# Endpoints: 404
# Modules: 397
# Categories: 53
```

---

## 🛠️ Try the CLI (2 min)

### 1. Analyze Endpoint
```bash
python spec_analyzer.py analyze-endpoint rest/finance/earnings

# Shows:
# - API calls observed in HAR
# - Modules using this endpoint
# - Call counts
```

### 2. Build Feature Map
```bash
python spec_analyzer.py feature-map --output features.json

# Generates feature_map.json with:
# - Features grouped by category
# - Endpoints per feature
# - Modules per feature
```

### 3. Generate OpenAPI
```bash
python spec_analyzer.py openapi --output perplexity_api.json

# Creates basic OpenAPI v3 spec
# Use with: Swagger UI, Postman, ReDoc
```

### 4. Compare Specs
```bash
# (If you have two versions)
python spec_analyzer.py diff old_spec.json new_spec.json --output changes.json

# Shows added/removed endpoints & modules
```

---

## 📚 Read the Docs

| File | Read Time | Purpose |
|------|-----------|----------|
| **[README.md](./README.md)** | 5 min | Full overview |
| **[SUMMARY.md](./SUMMARY.md)** | 3 min | Executive summary |
| **[ROADMAP.md](./ROADMAP.md)** | 5 min | Phase 1-3 planning |
| **[.copilot-instructions.md](./.copilot-instructions.md)** | 10 min | Implementation guide |

---

## 💻 Quick Python Examples

### Load and Query Spec
```python
import json

with open('perplexity_spa_full_spec.json') as f:
    spec = json.load(f)

# Get all finance endpoints
finance = spec['endpoints']['rest_by_category']['finance']
print(f"Finance endpoints: {len(finance)}")
for ep in finance[:3]:
    print(f"  - {ep}")
```

### Decompress Source Code
```python
import gzip
import base64

# Pick a module
filename = list(spec['source_codes'].keys())[0]
base64_data = spec['source_codes'][filename]

# Decompress
compressed = base64.b64decode(base64_data)
source = gzip.decompress(compressed).decode('utf-8')

print(f"Module: {filename}")
print(f"Size: {len(source)} bytes")
print(f"First 200 chars:\n{source[:200]}")
```

### Find API Calls
```python
# Get all observed API calls
api_calls = spec['requests']['api_calls']

# Filter by path pattern
earnings_calls = [c for c in api_calls if 'earnings' in c['path']]
print(f"Earnings API calls: {len(earnings_calls)}")
```

---

## 🎯 What's Next?

### Phase 2 Tasks (Pick One)

1. **2A: Extract Schemas** (🔴 HIGH priority, 3-4h)  
   Extract request/response schemas for all 404 endpoints

2. **2D: Real-time APIs** (🟡 MEDIUM priority, 3-4h)  
   Map SSE/WebSocket streaming endpoints

3. **2B: Component Graph** (🟡 MEDIUM priority, 4-5h)  
   Build React component → hook → API dependency graph

4. **2C: Feature Flags** (🟢 LOW priority, 2-3h)  
   Discover A/B tests and feature toggles

**See [ROADMAP.md](./ROADMAP.md) for details.**

---

## ❓ Common Questions

### Q: Where is the source code?
A: In `perplexity_spa_full_spec.json` under `source_codes` (gzip + base64 encoded). Use the decompress example above.

### Q: Can I use this for my project?
A: Yes! For research, documentation, SDK generation. Respect Perplexity's ToS.

### Q: How do I contribute?
A: Pick a Phase 2 task from ROADMAP, implement, create PR with artifact + docs.

### Q: Where are the schemas?
A: Phase 2 task 2A will extract them. Current spec has raw HAR data.

---

## 🔗 Quick Links

- **Main Artifact**: [perplexity_spa_full_spec.json](./perplexity_spa_full_spec.json) (1.9 MB)
- **CLI Tool**: [spec_analyzer.py](./spec_analyzer.py)
- **Full README**: [README.md](./README.md)
- **Roadmap**: [ROADMAP.md](./ROADMAP.md)
- **Pull Request**: [#8](https://github.com/pv-udpv/pplx-spa-assets-knowledge/pull/8)
- **Original Issue**: [#7](https://github.com/pv-udpv/pplx-spa-assets-knowledge/issues/7)

---

**Last Updated**: 22 January 2026  
**Time to Get Started**: ~5 minutes  
**Status**: Phase 1 Complete ✅