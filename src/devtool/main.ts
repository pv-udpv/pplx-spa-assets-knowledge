import { PerplexityDevTool } from './platforms/mobile/ErudaPlugin';
import { StickyButton } from './core/StickyButton';

// Store instances for potential cleanup
let pluginInstance: PerplexityDevTool | null = null;
let stickyBtnInstance: StickyButton | null = null;

// Platform detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(
  navigator.userAgent
);

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Init Eruda
  const eruda = window.eruda;

  if (typeof eruda === 'undefined') {
    console.error('[Perplexity DevTool] Eruda not loaded!');
    return;
  }

  eruda.init({
    useShadowDom: true,
    autoScale: true,
    defaults: {
      displaySize: isMobile ? 40 : 50,
      transparency: 0.95,
    },
    tool: ['console', 'elements', 'network', 'resources', 'sources'],
  });

  // Register our plugin
  pluginInstance = new PerplexityDevTool();
  eruda.add(pluginInstance);

  // Add sticky button (desktop + mobile)
  stickyBtnInstance = new StickyButton({
    onClick: () => {
      eruda.show('Perplexity');
    },
  });
  stickyBtnInstance.init();

  // Startup log
  console.log(
    '%c⚡ Perplexity DevTool loaded!',
    'color: #667eea; font-size: 16px; font-weight: bold'
  );

  console.log(
    `%cPlatform: ${isMobile ? 'Mobile' : 'Desktop'} | Eruda: Ready`,
    'color: #49cc90; font-size: 12px'
  );

  console.log(
    '%cDrag the purple button to reposition | Click to open DevTool',
    'color: #aaa; font-size: 11px'
  );
}

// Cleanup on page unload (best effort for userscript environment)
window.addEventListener('beforeunload', () => {
  if (pluginInstance) {
    pluginInstance.destroy();
    pluginInstance = null;
  }
  if (stickyBtnInstance) {
    stickyBtnInstance.destroy();
    stickyBtnInstance = null;
  }
});
