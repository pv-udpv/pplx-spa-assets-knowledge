# 🔍 Perplexity SPA Reverse Engineering & MCP Toolkit

**Полная reverse-engineering API + SPA архитектура из HAR capture.**

[![Phase](https://img.shields.io/badge/Phase-1%20%E2%9C%85%20Complete-brightgreen)](#status)
[![Endpoints](https://img.shields.io/badge/REST-404-blue)](#endpoints)
[![Modules](https://img.shields.io/badge/JS-397-blue)](#modules)
[![Size](https://img.shields.io/badge/Source-1.2%20MB%20gzip-blue)](#compression)

---

## 📋 Что это?

**Production-ready toolkit** для reverse-engineering Perplexity.ai SPA:

- ✅ **404 REST endpoints** — полный каталог & нормализация
- ✅ **397 JS модулей** — gzip-сжатый source code  
- ✅ **14+ SSE endpoints** — real-time streaming
- ✅ **Полный dependency analysis** (components → hooks → APIs)
- ✅ **CLI tooling** — 4 команды для exploration & analysis
- ✅ **OpenAPI v3 generation** — готово

Идеально для:
- 🔬 API research & reverse engineering
- 📖 Documentation generation (OpenAPI/AsyncAPI)
- 🧠 Machine learning training data
- 🛠️ SDK/client library generation
- 🔐 Security research (with responsible disclosure)

---

## 🚀 Quick Start

### 1. Explore the Spec

```bash
# View main artifact
ls -lh perplexity_spa_full_spec.json
# 1.9 MB (includes 397 modules gzipped)

# Load & query
python3 << 'EOF'
import json
with open('perplexity_spa_full_spec.json') as f:
    spec = json.load(f)

print(f"📊 Endpoints: {len(spec['endpoints']['rest'])}")
print(f"📦 Modules: {len(spec['source_codes_meta'])}")
print(f"🏷️  Categories: {len(spec['endpoints']['rest_by_category'])}")
EOF
```

### 2. Use the CLI Tool

```bash
# Analyze specific endpoint
python spec_analyzer.py analyze-endpoint rest/finance/earnings

# Build feature map
python spec_analyzer.py feature-map --output feature_map.json

# Generate OpenAPI
python spec_analyzer.py openapi --output perplexity_api.openapi.json

# Compare two specs
python spec_analyzer.py diff old_spec.json new_spec.json --output changes.json
```

### 3. Read the Docs

| Doc | Purpose |
|-----|----------|
| **[SUMMARY.md](./SUMMARY.md)** | TL;DR overview |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Full system design |
| **[ROADMAP.md](./ROADMAP.md)** | Phase planning & priorities |
| **[.copilot-instructions.md](./.copilot-instructions.md)** | Instructions for agents |
| **[perplexity_spec_toolkit.md](./perplexity_spec_toolkit.md)** | Full source code reference |

---

## 📊 By The Numbers

```
Extraction Date:        21 January 2026
HAR Entries:            786
JS Modules Total:       752 (322 vendor filtered, 397 app stored)
REST Endpoints:         404 (53 categories)
SSE Endpoints:          14+
React Hooks Found:      195+
Source Code Size:       3.37 MB → 1.2 MB (65% gzip reduction)
Spec File Size:         1.9 MB
Endpoints with Calls:   ~380 (observed in HAR trace)
```

---

## 🛠️ CLI Commands

### analyze-endpoint
```bash
python spec_analyzer.py analyze-endpoint rest/finance/earnings

# Output:
# 📍 Endpoint: rest/finance/earnings
#    Found in 3 modules
#    Total calls: 5
```

### feature-map
```bash
python spec_analyzer.py feature-map --output features.json
# Shows features grouped by modules & endpoints
```

### openapi
```bash
python spec_analyzer.py openapi --output perplexity_api.json
# Generates OpenAPI 3.0 spec
# Compatible with: Swagger UI, Postman, ReDoc
```

### diff
```bash
python spec_analyzer.py diff spec_old.json spec_new.json --output delta.json
# Compares two specs and shows:
# - Added/removed endpoints
# - Changed modules
# - Category growth
```

---

## 📚 Документация

### Для быстрого понимания
1. **[SUMMARY.md](./SUMMARY.md)** — Начни отсюда (5 min)
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Детальный дизайн (10 min)

### Для использования tools
1. **[spec_analyzer.py](./spec_analyzer.py)** — CLI tool source
2. **[perplexity_spec_toolkit.md](./perplexity_spec_toolkit.md)** — Full reference

### Для contribution
1. **[ROADMAP.md](./ROADMAP.md)** — Phase 2-3 planning
2. **[.copilot-instructions.md](./.copilot-instructions.md)** — Next steps

---

## 🚀 Phase 2: What's Next?

### 2A: Request/Response Schemas (⏳)
Extract typing для всех endpoints:
```json
{
  "endpoint": "rest/finance/earnings",
  "query_params": {
    "market_identifier": { "type": "string", "required": true }
  },
  "response_sample": { ... }
}
```

### 2B: Component Graph (⏳)
Map React dependencies:
```json
{
  "component": "FinanceEarningsView",
  "hooks": ["useFinanceEarnings"],
  "endpoints": ["rest/finance/earnings"]
}
```

### 2C: Feature Flags (⏳)
Discover A/B tests:
```json
{
  "flag": "finance_earnings_redesign",
  "status": "active"
}
```

### 2D: Real-time Specs (⏳)
Full SSE/WebSocket analysis with message schemas.

---

## 🎯 Status

| Phase | Task | Status |
|-------|------|--------|
| **1** | Extract endpoints | ✅ Complete |
| **1** | Decompress sources | ✅ Complete |
| **1** | Build spec | ✅ Complete |
| **1** | CLI tooling | ✅ Complete |
| **1** | Documentation | ✅ Complete |
| **2A** | Request/response schemas | ⏳ TODO |
| **2B** | Component graph | ⏳ TODO |
| **2C** | Feature flags | ⏳ TODO |
| **2D** | Real-time specs | ⏳ TODO |
| **3** | OpenAPI/AsyncAPI | 🔮 Future |
| **3** | SDK generation | 🔮 Future |

---

## 📦 Installation

### Requirements
- Python 3.8+
- `pyyaml` (for OpenAPI generation)

### Setup
```bash
# Clone
git clone https://github.com/pv-udpv/pplx-spa-assets-knowledge.git
cd pplx-spa-assets-knowledge

# Virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install pyyaml

# Verify
python spec_analyzer.py --help
```

---

## 🤝 Contributing

We welcome contributions! Pick a Phase 2 task:

1. **[ROADMAP.md](./ROADMAP.md)** — Choose a task (2A-2D)
2. **[.copilot-instructions.md](./.copilot-instructions.md)** — Read implementation guide
3. Extend `spec_analyzer.py` or create new tool
4. Generate output artifact
5. Create PR with documentation

---

## 🔐 Responsible Use

This toolkit is for **educational & research purposes**:

✅ **Allowed:**
- API research & documentation
- Architecture analysis
- Security research (with responsible disclosure)
- SDK/client library development

❌ **NOT Allowed:**
- Unauthorized service access
- Malicious exploitation
- Spamming or abuse

**Please respect Perplexity's terms of service.**

---

## 📝 License

This project is for **educational & research purposes**.

Please respect Perplexity's terms of service.

---

## Quick Links

- 📊 [Summary](./SUMMARY.md)
- 🏗️ [Architecture](./ARCHITECTURE.md)
- 🗺️ [Roadmap](./ROADMAP.md)
- 📋 [Instructions](./.copilot-instructions.md)
- 🛠️ [Toolkit Guide](./perplexity_spec_toolkit.md)
- 💻 [CLI Tool](./spec_analyzer.py)
- 📦 [Main Artifact](./perplexity_spa_full_spec.json)

---

**Last Updated**: 22 January 2026, 08:00 MSK  
**Phase**: 1 Complete ✅ | Phase 2 Planning  
**Status**: Production-ready toolkit

**Made for the reverse engineering & API research community.** 🔬