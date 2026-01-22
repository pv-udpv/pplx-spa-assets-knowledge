# 🛠️ Perplexity DevTool Suite

> Advanced reverse engineering toolkit with Eruda integration for Perplexity.ai

## ✨ Features

- **📦 Sticky Draggable Button**: Edge-snap FAB с localStorage persistence
- **📱 Mobile-First**: Eruda DevTools integration для мобильных устройств
- **🔌 API Explorer**: Schema-driven endpoint testing
- **📊 Schema Inspector**: Live OpenAPI 3.1 builder
- **🌐 Network Monitor**: HAR capture + analytics
- **⚡ Hot Module Replacement**: Dev server с instant reload

## 📥 Installation

### Option 1: Install from GitHub (Recommended)

1. Установите [Tampermonkey](https://www.tampermonkey.net/)
2. Откройте [dist/pplx-devtool.user.js](https://raw.githubusercontent.com/pv-udpv/pplx-spa-assets-knowledge/feature/eruda-devtool/dist/pplx-devtool.user.js)
3. Tampermonkey предложит установку → нажмите "Install"
4. Откройте [www.perplexity.ai](https://www.perplexity.ai)
5. Увидите фиолетовую кнопку "API" в углу экрана 🎉

### Option 2: Build from Source

```bash
# Clone repo
git clone https://github.com/pv-udpv/pplx-spa-assets-knowledge.git
cd pplx-spa-assets-knowledge
git checkout feature/eruda-devtool

# Install dependencies
bun install
# or: npm install / pnpm install / yarn install

# Build userscript
bun run build

# Output: dist/pplx-devtool.user.js
# Установите через Tampermonkey
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ / Bun 1.0+
- Tampermonkey browser extension
- Git

### Setup

```bash
# Install dependencies
bun install

# Start dev server (HMR enabled)
bun run dev

# Server starts at http://localhost:3000
```

### Dev Mode with HMR

1. **Создайте dev userscript** в Tampermonkey:

```javascript
// ==UserScript==
// @name         Perplexity DevTool (DEV)
// @match        https://www.perplexity.ai/*
// @require      http://localhost:3000/@vite/client
// @require      http://localhost:3000/src/devtool/main.ts
// @grant        none
// ==/UserScript==
```

2. **Откройте** [www.perplexity.ai](https://www.perplexity.ai)

3. **Редактируйте файлы** в `src/devtool/`

4. **Изменения применяются мгновенно** ✨

### Build for Production

```bash
# Build minified userscript
bun run build

# Output: dist/pplx-devtool.user.js (~50KB)

# Watch mode (auto-rebuild on changes)
bun run serve
```

## 📚 Usage

### Sticky Button

- **Drag**: Перетаскивайте кнопку мышью или пальцем
- **Snap**: Отпустите → автоматически прилипнет к ближайшему краю
- **Click**: Открывает Eruda с табом "Perplexity"
- **Persistence**: Позиция сохраняется в localStorage

### Eruda DevTools

1. **API Tab**
   - Browse endpoints by category
   - Test API calls with one click
   - View formatted responses
   - Track coverage (called/total)

2. **Schema Tab**
   - Start traffic capture
   - View discovered endpoints
   - Export OpenAPI 3.1 JSON
   - Diff with repo version

3. **Network+ Tab**
   - Real-time traffic stats
   - Export HAR captures
   - Analytics (latency, errors)

4. **Settings Tab**
   - GitHub PAT configuration
   - Auto-sync toggle
   - Export templates

## 📋 Project Structure

```
src/devtool/
├── main.ts                     # Entry point
├── core/
│   ├── StickyButton.ts         # Draggable FAB
│   ├── PerplexityAPI.ts        # API client
│   ├── CoverageTracker.ts      # Track usage
│   ├── OpenAPIBuilder.ts       # Schema builder
│   └── Interceptors.ts         # fetch/XHR patches
├── platforms/
│   └── mobile/
│       ├── ErudaPlugin.ts      # Eruda integration
│       └── tabs/               # API/Schema/Network/Settings
├── types/
│   ├── eruda.d.ts              # Eruda types
│   └── api.d.ts                # API types
└── ui/
    ├── components/             # Reusable UI
    └── styles/                 # CSS
```

## 🔧 Tech Stack

- **Build**: [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- **Language**: TypeScript 5.7 (strict mode)
- **UI**: [Eruda](https://github.com/liriliri/eruda) plugin API
- **Storage**: localStorage + IndexedDB
- **Bundler**: Vite 6 + Terser

## 🚀 Scripts

```bash
# Development
bun run dev          # Start dev server with HMR

# Production
bun run build        # Build minified userscript
bun run serve        # Watch mode (auto-rebuild)

# Preview
bun run preview      # Preview build output
```

## 📊 Bundle Size

- **With CDN externals**: ~48KB (Eruda из CDN)
- **Standalone**: ~250KB (с Eruda bundled)
- **Dev mode**: Unbundled (HMR chunks)

## 🔗 Links

- **GitHub**: [pv-udpv/pplx-spa-assets-knowledge](https://github.com/pv-udpv/pplx-spa-assets-knowledge)
- **Issue**: [#12](https://github.com/pv-udpv/pplx-spa-assets-knowledge/issues/12)
- **Eruda Docs**: https://github.com/liriliri/eruda
- **vite-plugin-monkey**: https://github.com/lisonge/vite-plugin-monkey

## 🐛 Troubleshooting

### Dev server не запускается

```bash
# Проверьте порт 3000
lsof -i :3000

# Или укажите другой порт
bun run dev -- --port 3001
```

### HMR не работает

1. Проверьте `@require http://localhost:3000/@vite/client` в userscript
2. Откройте DevTools → Network → проверьте WebSocket коннект
3. Restart dev server

### Eruda не появляется

1. Проверьте `@require https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js`
2. Откройте Console → проверьте `window.eruda`
3. Вручную: `eruda.init()` в console

### Bundle слишком большой

```typescript
// vite.config.ts - добавьте externalGlobals
build: {
  externalGlobals: {
    eruda: cdn.jsdelivr('eruda', 'eruda.min.js'),
    // Другие CDN зависимости...
  }
}
```

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## 📝 License

MIT

---

**Author**: [@pv-udpv](https://github.com/pv-udpv)  
**Repo**: [pplx-spa-assets-knowledge](https://github.com/pv-udpv/pplx-spa-assets-knowledge)
