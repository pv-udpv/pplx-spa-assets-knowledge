#!/usr/bin/env ts-node
/**
 * Example: Complete browser automation workflow for Perplexity AI
 */

import { runBrowserSession, capturePresets } from '../src/browser/browser-automation';

async function main() {
  console.log('🚀 Perplexity AI Browser Automation Workflow');
  console.log('='.repeat(60));

  // Use API reversing preset optimized for API discovery
  const config = {
    ...capturePresets.apiReversing,
    output: {
      dir: './workflow-captures',
      format: 'json',
      compress: false,
    },
  };

  await runBrowserSession(config, async (browser) => {
    const cdp = browser.getCDPClient();

    // ============================================================
    // Phase 1: Navigation
    // ============================================================
    await browser.executeTask('Phase 1: Navigate', async () => {
      await cdp.navigate('https://www.perplexity.ai', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      console.log('   ✓ Page loaded');
    });

    // Wait for interactive
    await new Promise(r => setTimeout(r, 2000));

    // ============================================================
    // Phase 2: Capture Initial State
    // ============================================================
    await browser.executeTask('Phase 2: Capture Initial Storage', async () => {
      await cdp.captureStorage();
      console.log('   ✓ Initial storage state captured');
    });

    // ============================================================
    // Phase 3: User Interaction (Search)
    // ============================================================
    await browser.executeTask('Phase 3: Execute Search', async () => {
      // Type in search box
      const searchScript = `
        (async () => {
          const searchInput = document.querySelector('[placeholder*="Ask"], input[type="text"]');
          if (!searchInput) throw new Error('Search input not found');
          
          searchInput.focus();
          searchInput.value = 'What are the latest developments in artificial intelligence?';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Find and click search button
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent.includes('Search') || btn.textContent.includes('Send')) {
              btn.click();
              return true;
            }
          }
          throw new Error('Search button not found');
        })()
      `;

      try {
        const result = await cdp.executeJavaScript(searchScript);
        console.log('   ✓ Search executed');
      } catch (error) {
        console.error('   ✗ Search failed:', error instanceof Error ? error.message : error);
      }
    });

    // ============================================================
    // Phase 4: Wait for Response
    // ============================================================
    await browser.executeTask('Phase 4: Wait for AI Response', async () => {
      // Monitor WebSocket for completion
      const waitScript = `
        new Promise(resolve => {
          const timeout = setTimeout(() => resolve('timeout'), 15000);
          
          // Wait for response completion marker
          const checkCompletion = () => {
            const completionEl = document.querySelector('[data-testid="response-complete"], .response-finished');
            if (completionEl) {
              clearTimeout(timeout);
              resolve('complete');
              return;
            }
            setTimeout(checkCompletion, 100);
          };
          checkCompletion();
        })
      `;

      try {
        const result = await cdp.executeJavaScript(waitScript);
        console.log('   ✓ Response received:', result);
      } catch (error) {
        console.log('   ⚠ Response wait timed out (expected if using polling)');
      }
    });

    // ============================================================
    // Phase 5: Extract Response Data
    // ============================================================
    await browser.executeTask('Phase 5: Extract Response', async () => {
      const extractScript = `
        (async () => {
          const responseText = document.querySelector('[data-testid="response"], .response-text')?.textContent || '';
          const sources = Array.from(document.querySelectorAll('[data-testid="source"], .source-link'))
            .map(el => el.textContent || el.href)
            .slice(0, 5);
          
          return {
            responseLength: responseText.length,
            sourcesCount: sources.length,
            sources: sources,
          };
        })()
      `;

      try {
        const data = await cdp.executeJavaScript(extractScript);
        console.log('   ✓ Response data extracted:', data);
      } catch (error) {
        console.log('   ⚠ Could not extract response data');
      }
    });

    // ============================================================
    // Phase 6: Capture Final State
    // ============================================================
    await browser.executeTask('Phase 6: Capture Final Storage', async () => {
      await cdp.captureStorage();
      console.log('   ✓ Final storage state captured');
    });

    // ============================================================
    // Phase 7: Network Analysis
    // ============================================================
    await browser.executeTask('Phase 7: Analyze Network', async () => {
      const capture = cdp.getCaptureData();
      console.log(`   ✓ Network requests: ${capture.har.log.entries.length}`);
      console.log(`   ✓ Storage items: ${Object.keys(capture.localStorage).length}`);
      console.log(`   ✓ Cookies: ${capture.cookies.length}`);
    });
  });

  console.log('\n✅ Workflow completed');
  console.log('📂 Captures saved to: ./workflow-captures');
}

main().catch((error) => {
  console.error('❌ Workflow failed:', error);
  process.exit(1);
});
