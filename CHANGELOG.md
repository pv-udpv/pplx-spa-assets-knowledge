# Changelog

All notable changes to the Perplexity DevTool Suite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-22

### Added
- 🎉 **Initial Release** of Perplexity DevTool Suite
- **Sticky Draggable Button**
  - Edge-snap functionality to nearest screen edge
  - localStorage persistence for button position
  - Touch and mouse event support
  - Smooth cubic-bezier animations
  - Mobile and desktop support
- **Eruda DevTools Integration**
  - Custom Perplexity plugin for Eruda
  - Four main tabs: API Explorer, Schema Inspector, Network Monitor, Settings
  - Mobile-first responsive UI
  - Shadow DOM support for style isolation
- **API Explorer Tab**
  - Schema-driven endpoint browser
  - Category-based endpoint organization
  - One-click endpoint testing
  - Real-time response viewer with JSON formatting
  - Coverage tracking (called/total endpoints)
- **Schema Inspector Tab**
  - Live OpenAPI 3.1 schema builder
  - Network traffic capture and auto-learning
  - Endpoint discovery from live traffic
  - Diff with repository schema version
  - Export to OpenAPI JSON format
- **Network Monitor Tab**
  - Real-time network statistics
  - Latency, error rate, and throughput analytics
  - HAR 1.2 format capture
  - Export to HAR/CSV
  - Traffic log with last 100 requests
- **Settings Tab**
  - GitHub PAT configuration for auto-sync
  - Auto-sync toggle for schema updates
  - Export template configuration
  - Capture presets and filters
- **Interceptors**
  - fetch API interception
  - XMLHttpRequest interception
  - Automatic request/response logging
  - Performance metrics collection
- **Build System**
  - vite-plugin-monkey integration
  - Hot Module Replacement (HMR) for development
  - CDN externals for Eruda (reduces bundle size)
  - esbuild minification
  - TypeScript strict mode
  - Auto-generated userscript headers

### Technical Details
- **Bundle Size**: 38.91 KB (uncompressed), ~10 KB (gzipped)
- **Target**: ES2022
- **TypeScript**: 5.7+ with strict mode
- **Vite**: 6.4.1
- **vite-plugin-monkey**: 7.1.8
- **Dependencies**: Zero runtime dependencies (Eruda loaded from CDN)

### Requirements Met
- ✅ Sticky button drag & drop (mouse + touch)
- ✅ Position persistence across sessions
- ✅ Eruda opens on button click
- ✅ "Perplexity" tab with 4 sub-tabs
- ✅ API endpoint testing through UI
- ✅ Schema auto-update on traffic capture
- ✅ HAR export functionality
- ✅ GitHub sync with PAT
- ✅ Bundle size ≤ 50KB (38.91 KB achieved)
- ✅ HMR in dev mode

### Known Issues
None at release.

### Developer Notes
- Eruda is loaded from CDN to minimize bundle size
- localStorage used for settings and small data
- IndexedDB planned for large HAR captures (future enhancement)
- TypeScript compilation requires DOM lib in tsconfig.json
- All strict mode type checking passes

[1.0.0]: https://github.com/pv-udpv/pplx-spa-assets-knowledge/releases/tag/v1.0.0
