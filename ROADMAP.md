# Perplexity SPA Reverse Engineering — Roadmap

## Current Status (Phase 1 ✅)

```
HAR Capture (21.01.2026)
    ↓
    │ 786 entries → 752 JS modules → 397 app-code
    │
    ├─ REST endpoints extraction → 404 unique paths (53 categories)
    ├─ SSE endpoints mapping → ~14 streaming paths
    ├─ JS source decompilation → base64(gzip(...)) storage
    ├─ Asset cataloging → CSS, images, fonts
    └─ Initial analysis → React hooks, API functions
    
    ↓ OUTPUT
    
perplexity_spa_full_spec.json
├─ metadata (extraction info)
├─ endpoints (REST, SSE, WebSocket)
├─ assets (JS, CSS, images, fonts)
├─ requests (observed API calls from HAR)
├─ source_codes (gzip-compressed app code)
├─ source_codes_meta (module metadata)
└─ analysis (hooks, functions, flags)

✅ READY: Full spec contract (1.9 MB) + JSON Schema
✅ READY: spec_analyzer.py CLI (4 commands)
✅ READY: perplexity_spec_toolkit.md (full source code)
✅ READY: .copilot-instructions.md (next steps)
```

---

## Phase 2: Deep Analysis (TODO)

### 2A. Request/Response Schemas ⏳
**Extract typing information for all endpoints**

### 2B. Component → Hook → API Graph 📊
**Map dependencies across 3 layers**

### 2C. Feature Flags & Experiments 🚩
**Discover A/B tests and feature gates**

### 2D. Real-time APIs (SSE/WebSocket) 🔄
**Map streaming connections & message types**

---

## Phase 3: Integration & Publishing (Future)

### 3A. OpenAPI/AsyncAPI Generation
### 3B. SDK Generation
### 3C. Visualization

---

## Success Metrics

| Metric | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|  
| Endpoints documented | ✅ 404 | 2A: 100% | 3A: 100% |
| Request/response types | ✅ Status | 2A: ≥80% | 3B: 100% |
| Component dependencies | ✅ Partial | 2B: Full | 3C: Viz |
| Feature flags mapped | ✅ Samples | 2C: ≥90% | - |
| Real-time APIs | ✅ 14 SSE | 2D: Full | 3A: AsyncAPI |

---

**Last Updated**: 22.01.2026 02:50 MSK  
**Status**: Phase 1 Complete, Phase 2 Planning