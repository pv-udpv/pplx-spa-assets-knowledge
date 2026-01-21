# 🔍 Perplexity SPA Reverse Engineering & MCP Toolkit

**Complete reverse-engineered API surface + SPA architecture from HAR capture.**

[![Status](https://img.shields.io/badge/Phase-1%20%E2%9C%85%20Complete-brightgreen)](#status)
[![Endpoints](https://img.shields.io/badge/REST%20Endpoints-404-blue)](#endpoints)
[![Modules](https://img.shields.io/badge/JS%20Modules-397%20(app)-blue)](#modules)
[![Size](https://img.shields.io/badge/Source%20Size-1.2%20MB%20(gzip)-blue)](#compression)

---

## 📋 What Is This?

A **complete, production-ready reverse-engineering toolkit** for Perplexity.ai SPA:

- ✅ **404 REST endpoints** catalogued & normalized
- ✅ **397 JavaScript app modules** (gzip-compressed source code)
- ✅ **14+ SSE streaming endpoints** for real-time data
- ✅ **Full dependency analysis** (components → hooks → APIs)
- ✅ **CLI tooling** for exploration & analysis
- ✅ **OpenAPI v3 generation** ready

Perfect for:
- 🔬 API research & reverse engineering
- 📖 Documentation generation (OpenAPI/AsyncAPI)
- 🧠 Machine learning training data
- 🛠️ SDK/client library generation
- 🔐 Security research (with responsible disclosure)

---

## 🚀 Quick Start

### 1. Explore the Spec

```bash
# View main artifact (not included in repo - generated from your HAR)
# See ROADMAP.md for generation instructions

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
# Analyze a specific endpoint
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
|-----|---------|  
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

## 📦 Installation

### Requirements
- Python 3.8+
- `pyyaml` (for OpenAPI generation)

### Setup
```bash
# Clone
git clone https://github.com/pv-udpv/pplx-spa-assets-knowledge.git
cd pplx-spa-assets-knowledge

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate

# Install dependencies
pip install pyyaml

# Verify
python spec_analyzer.py --help
```

---

## 🔐 Responsible Use

This toolkit is for **educational & research purposes**:

✅ **Allowed:**
- API research & documentation
- Architecture analysis
- Security research (with responsible disclosure)
- SDK/client library development
- Machine learning training

❌ **NOT Allowed:**
- Unauthorized service access
- Credential theft
- Malicious API exploitation
- Spamming or abuse

**Please respect Perplexity's terms of service and responsible disclosure practices.**

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
| **3** | Visualization | 🔮 Future |

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

---

**Last Updated**: 22 January 2026, 02:50 MSK  
**Phase**: 1 Complete ✅ | Phase 2 Planning  
**Status**: Production-ready toolkit

---

**Made for the reverse engineering & API research community.** 🔬