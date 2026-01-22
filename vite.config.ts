import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/devtool/main.ts',
      userscript: {
        name: 'Perplexity DevTool (Eruda Edition)',
        namespace: 'https://github.com/pv-udpv/pplx-spa-assets-knowledge',
        version: '1.0.0',
        description: 'Advanced DevTool with Eruda integration for mobile reverse engineering',
        author: 'pv-udpv',
        match: ['https://www.perplexity.ai/*'],
        icon: 'https://www.perplexity.ai/favicon.ico',
        
        // Auto-inject Eruda from CDN
        require: [
          'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js'
        ],
        
        // Grants (auto-detect from code)
        grant: [
          'GM_getValue',
          'GM_setValue',
          'GM_xmlhttpRequest'
        ],
        
        // External resources
        connect: [
          'api.github.com',
          'raw.githubusercontent.com'
        ],
        
        // Run timing
        'run-at': 'document-start',
        
        // Metadata
        homepage: 'https://github.com/pv-udpv/pplx-spa-assets-knowledge',
        supportURL: 'https://github.com/pv-udpv/pplx-spa-assets-knowledge/issues',
        downloadURL: 'https://raw.githubusercontent.com/pv-udpv/pplx-spa-assets-knowledge/main/dist/pplx-devtool.user.js',
        updateURL: 'https://raw.githubusercontent.com/pv-udpv/pplx-spa-assets-knowledge/main/dist/pplx-devtool.user.js',
      },
      
      build: {
        // External globals (CDN dependencies)
        externalGlobals: {
          // Eruda is loaded via @require, not bundled
        },
        
        // Minify
        minify: true,
        
        // Source maps for dev
        sourcemap: process.env.NODE_ENV === 'development',
        
        // Output filename
        fileName: 'pplx-devtool.user.js',
      },
      
      server: {
        // Dev server for HMR
        open: false,
      },
    }),
  ],
  
  resolve: {
    alias: {
      '@': '/src/devtool',
      '@core': '/src/devtool/core',
      '@platforms': '/src/devtool/platforms',
    },
  },
  
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
});
