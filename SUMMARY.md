# 📦 Perplexity SPA Reverse Engineering — Summary

## 🎯 What We Have

### Deliverables

| Item | Status | Details |
|------|--------|---------|  
| **Full Spec** | ✅ | `perplexity_spa_full_spec.json` (1.9 MB gzipped) |
| **API Surface** | ✅ | 404 REST endpoints + 14 SSE streams + JSON Schema contract |
| **Source Code** | ✅ | 397 app modules (3.37 MB → 1.2 MB gzipped, indexed) |
| **Analysis CLI** | ✅ | `spec_analyzer.py` — 4 commands |
| **Toolkit** | ✅ | `perplexity_spec_toolkit.md` — full source code |
| **Roadmap** | ✅ | Phase 1 complete, Phase 2-3 planning docs |

---

## 📊 Numbers

```
HAR Extraction (21.01.2026)
├─ HAR entries:           786
├─ JS modules:            752 (322 vendor, 397 app ✅)
├─ REST endpoints:        404 (53 categories)
├─ SSE endpoints:         14+
├─ React hooks:           195+
├─ Source size:           3.37 MB → 1.2 MB (gzip)
└─ Spec file size:        1.9 MB (gzipped)
```

---

## 🔧 Tools

### 1. **spec_analyzer.py** — CLI Analyzer
```bash
# Analyze single endpoint
python spec_analyzer.py analyze-endpoint rest/finance/earnings

# Build feature map
python spec_analyzer.py feature-map --output features.json

# Generate OpenAPI v3
python spec_analyzer.py openapi --output api.json

# Compare specs
python spec_analyzer.py diff old.json new.json --output delta.json
```

---

## 📚 How to Use the Spec

### Python
```python
import json
import gzip
import base64

# Load spec
with open('perplexity_spa_full_spec.json') as f:
    spec = json.load(f)

# Get all endpoints
all_endpoints = spec['endpoints']['rest']  # 404 items

# Get endpoints by category
finance_endpoints = spec['endpoints']['rest_by_category']['finance']

# Access source code
for filename, meta in spec['source_codes_meta'].items():
    base64_data = spec['source_codes'][filename]
    compressed = base64.b64decode(base64_data)
    source = gzip.decompress(compressed).decode('utf-8')
    print(f"{filename}: {len(source)} bytes")
```

---

## 🚀 Phase 2: What Comes Next

### 2A: Request/Response Schemas (⏳ TODO)
Extract typing for all 404 endpoints.

### 2B: Component Graph (⏳ TODO)  
Map React component → hooks → API calls.

### 2C: Feature Flags (⏳ TODO)
Discover A/B tests.

### 2D: Real-time APIs (⏳ TODO)
Map SSE/WebSocket.

---

## 📝 How to Use

### Quick Start
```bash
# 1. Install dependencies
python -m venv .venv
source .venv/bin/activate
pip install pyyaml

# 2. Run analyzer
python spec_analyzer.py feature-map --output feature_map.json

# 3. Generate OpenAPI
python spec_analyzer.py openapi --output perplexity_api.json
```

---

## ✅ Success Criteria (Current Phase)

- [x] Extract all endpoints from HAR
- [x] Decompress and index all app source code
- [x] Build complete spec with JSON Schema
- [x] Create CLI analyzer with 4 base commands
- [x] Document full toolkit for Phase 2
- [x] Provide instructions for continuation

---

## 🎯 TL;DR

**We have**: Full reverse-engineered SPA spec with 404 endpoints, 397 app modules (gzipped source included), and a CLI toolkit.

**Status**: Phase 1 ✅ Complete. Phase 2 planning ready.

**Next**: Pick one of 4 Phase 2 tasks (schemas, graph, flags, realtime), extend toolkit, generate output.

**Tools**: `spec_analyzer.py` CLI + source code in `perplexity_spec_toolkit.md`.

**Docs**: All in this repo — explore with `ROADMAP.md` → `.copilot-instructions.md` → implementation.

---

**Generated**: 22.01.2026 08:05 MSK  
**Status**: Phase 1 Complete ✅