/**
 * Anti-Bot Detection Analyzer
 * Analyzes website protection mechanisms and fingerprinting techniques
 */

import { CDPClient } from './cdp-client.js';

export interface AntiBotAnalysisResult {
  cloudflare: boolean;
  recaptcha: boolean;
  hcaptcha: boolean;
  canvas: boolean;
  webrtc: boolean;
  webdriver: boolean;
  fingerprinting: {
    userAgent: boolean;
    languages: boolean;
    plugins: boolean;
    fonts: boolean;
    screen: boolean;
    timezone: boolean;
    hardware: boolean;
  };
  exposedHeaders: string[];
  suspiciousScripts: Array<{
    url: string;
    reason: string;
  }>;
  timingAPIs: {
    performance: boolean;
    highResolution: boolean;
  };
  details: Record<string, any>;
}

export class AntiBotAnalyzer {
  // CDP client reserved for future use when Runtime.evaluate is integrated
  // private _cdp: CDPClient;

  constructor(_cdp: CDPClient) {
    // this._cdp = _cdp;
  }

  /**
   * Analyze website for anti-bot protection mechanisms
   */
  async analyzeProtection(): Promise<AntiBotAnalysisResult> {
    console.log('🔍 Analyzing anti-bot protection...');
    console.log('⚠️  Note: Analysis requires CDP Runtime.evaluate integration');

    const result: AntiBotAnalysisResult = {
      cloudflare: false,
      recaptcha: false,
      hcaptcha: false,
      canvas: false,
      webrtc: false,
      webdriver: false,
      fingerprinting: {
        userAgent: false,
        languages: false,
        plugins: false,
        fonts: false,
        screen: false,
        timezone: false,
        hardware: false,
      },
      exposedHeaders: [],
      suspiciousScripts: [],
      timingAPIs: {
        performance: false,
        highResolution: false,
      },
      details: {},
    };

    try {
      // Detect Cloudflare
      result.cloudflare = await this.detectCloudflare();

      // Detect reCAPTCHA
      result.recaptcha = await this.detectRecaptcha();

      // Detect hCAPTCHA
      result.hcaptcha = await this.detectHCaptcha();

      // Detect Canvas fingerprinting
      result.canvas = await this.detectCanvasFingerprinting();

      // Detect WebRTC fingerprinting
      result.webrtc = await this.detectWebRTCFingerprinting();

      // Detect WebDriver
      result.webdriver = await this.detectWebDriver();

      // Analyze fingerprinting techniques
      result.fingerprinting = await this.detectFingerprintingTechniques();

      // Check exposed headers
      result.exposedHeaders = await this.getExposedHeaders();

      // Check timing APIs
      result.timingAPIs = await this.checkTimingAPIs();

      // Analyze scripts
      result.suspiciousScripts = await this.analyzeSuspiciousScripts();
    } catch (error) {
      console.log(`⚠️  Analysis incomplete: ${error instanceof Error ? error.message : String(error)}`);
      console.log('   This feature will be available when browser automation is fully integrated');
    }

    // Print summary
    this.printSummary(result);

    return result;
  }

  /**
   * Detect Cloudflare protection
   */
  private async detectCloudflare(): Promise<boolean> {
    const script = `
      (function() {
        // Check for Cloudflare indicators
        const cfCookie = document.cookie.includes('__cf');
        const cfScript = Array.from(document.scripts).some(s => 
          s.src.includes('cloudflare') || s.src.includes('cf-')
        );
        const cfChallenge = document.querySelector('[data-ray]') !== null;
        const cfHeaders = fetch !== undefined; // Would need to check actual headers

        return cfCookie || cfScript || cfChallenge;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Detect reCAPTCHA
   */
  private async detectRecaptcha(): Promise<boolean> {
    const script = `
      (function() {
        const recaptchaDiv = document.querySelector('.g-recaptcha') !== null;
        const recaptchaScript = Array.from(document.scripts).some(s => 
          s.src.includes('recaptcha') || s.src.includes('google.com/recaptcha')
        );
        const recaptchaAPI = typeof grecaptcha !== 'undefined';

        return recaptchaDiv || recaptchaScript || recaptchaAPI;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Detect hCAPTCHA
   */
  private async detectHCaptcha(): Promise<boolean> {
    const script = `
      (function() {
        const hcaptchaDiv = document.querySelector('.h-captcha') !== null;
        const hcaptchaScript = Array.from(document.scripts).some(s => 
          s.src.includes('hcaptcha')
        );
        const hcaptchaAPI = typeof hcaptcha !== 'undefined';

        return hcaptchaDiv || hcaptchaScript || hcaptchaAPI;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Detect Canvas fingerprinting
   */
  private async detectCanvasFingerprinting(): Promise<boolean> {
    const script = `
      (function() {
        // Check if canvas methods are being called for fingerprinting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return false;

        // Common fingerprinting patterns
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

        let canvasCalled = false;

        HTMLCanvasElement.prototype.toDataURL = function(...args) {
          canvasCalled = true;
          return originalToDataURL.apply(this, args);
        };

        CanvasRenderingContext2D.prototype.getImageData = function(...args) {
          canvasCalled = true;
          return originalGetImageData.apply(this, args);
        };

        // Check for existing canvas fingerprinting scripts
        const hasCanvasScript = Array.from(document.scripts).some(s => 
          s.textContent && (
            s.textContent.includes('toDataURL') ||
            s.textContent.includes('getImageData') ||
            s.textContent.includes('canvas fingerprint')
          )
        );

        return hasCanvasScript;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Detect WebRTC fingerprinting
   */
  private async detectWebRTCFingerprinting(): Promise<boolean> {
    const script = `
      (function() {
        // Check if WebRTC is being used for fingerprinting
        const hasRTCPeerConnection = typeof RTCPeerConnection !== 'undefined';
        const hasWebRTC = typeof navigator.mediaDevices !== 'undefined';

        // Check for scripts that use WebRTC
        const hasWebRTCScript = Array.from(document.scripts).some(s => 
          s.textContent && (
            s.textContent.includes('RTCPeerConnection') ||
            s.textContent.includes('createDataChannel') ||
            s.textContent.includes('icecandidate')
          )
        );

        return hasRTCPeerConnection && hasWebRTCScript;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Detect WebDriver
   */
  private async detectWebDriver(): Promise<boolean> {
    const script = `
      (function() {
        return navigator.webdriver === true;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Detect fingerprinting techniques
   */
  private async detectFingerprintingTechniques(): Promise<AntiBotAnalysisResult['fingerprinting']> {
    const script = `
      (function() {
        const techniques = {
          userAgent: false,
          languages: false,
          plugins: false,
          fonts: false,
          screen: false,
          timezone: false,
          hardware: false,
        };

        // Scan scripts for fingerprinting patterns
        const scriptContent = Array.from(document.scripts)
          .map(s => s.textContent || '')
          .join(' ');

        techniques.userAgent = scriptContent.includes('navigator.userAgent') ||
                                scriptContent.includes('navigator.platform');

        techniques.languages = scriptContent.includes('navigator.languages') ||
                               scriptContent.includes('navigator.language');

        techniques.plugins = scriptContent.includes('navigator.plugins') ||
                             scriptContent.includes('navigator.mimeTypes');

        techniques.fonts = scriptContent.includes('font') && 
                           (scriptContent.includes('measure') || scriptContent.includes('offsetWidth'));

        techniques.screen = scriptContent.includes('screen.width') ||
                            scriptContent.includes('screen.height') ||
                            scriptContent.includes('screen.colorDepth');

        techniques.timezone = scriptContent.includes('getTimezoneOffset') ||
                              scriptContent.includes('Intl.DateTimeFormat');

        techniques.hardware = scriptContent.includes('navigator.hardwareConcurrency') ||
                              scriptContent.includes('navigator.deviceMemory');

        return techniques;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Get exposed security headers
   */
  private async getExposedHeaders(): Promise<string[]> {
    // This would need to inspect network responses from captured HAR
    // For now, return common security headers to check
    return [
      'X-Frame-Options',
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'Strict-Transport-Security',
      'X-XSS-Protection',
      'Referrer-Policy',
    ];
  }

  /**
   * Check timing APIs
   */
  private async checkTimingAPIs(): Promise<AntiBotAnalysisResult['timingAPIs']> {
    const script = `
      (function() {
        return {
          performance: typeof performance !== 'undefined',
          highResolution: typeof performance !== 'undefined' && 
                          typeof performance.now === 'function',
        };
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Analyze suspicious scripts
   */
  private async analyzeSuspiciousScripts(): Promise<Array<{ url: string; reason: string }>> {
    const script = `
      (function() {
        const suspicious = [];
        const scripts = Array.from(document.scripts);

        for (const script of scripts) {
          const src = script.src;
          const content = script.textContent || '';

          // Check for suspicious patterns
          if (src.includes('cloudflare') || src.includes('cf-')) {
            suspicious.push({ url: src, reason: 'Cloudflare protection' });
          }
          
          if (src.includes('recaptcha') || content.includes('grecaptcha')) {
            suspicious.push({ url: src || 'inline', reason: 'reCAPTCHA' });
          }

          if (src.includes('hcaptcha') || content.includes('hcaptcha')) {
            suspicious.push({ url: src || 'inline', reason: 'hCAPTCHA' });
          }

          if (content.includes('canvas') && content.includes('fingerprint')) {
            suspicious.push({ url: src || 'inline', reason: 'Canvas fingerprinting' });
          }

          if (content.includes('webdriver') || content.includes('navigator.webdriver')) {
            suspicious.push({ url: src || 'inline', reason: 'WebDriver detection' });
          }
        }

        return suspicious;
      })()
    `;

    return await this.evaluateScript(script);
  }

  /**
   * Helper: Evaluate script and return result.
   *
   * NOTE: This method is intentionally left unimplemented. In a real browser
   * environment, it should delegate to the CDP Runtime.evaluate command using
   * the provided JavaScript source code.
   */
  private async evaluateScript<T = any>(script: string): Promise<T> {
    // This is a placeholder for CDP Runtime.evaluate integration.
    // Example of a future implementation:
    //
    // const result = await Runtime.evaluate({ expression: script });
    // return result.result.value as T;
    //
    // Until CDP integration is wired up, we fail fast to make any accidental
    // usage of this stub explicit.
    throw new Error(
      'evaluateScript is not implemented - attempted to evaluate script: ' + script
    );
  }

  /**
   * Print analysis summary
   */
  private printSummary(result: AntiBotAnalysisResult): void {
    console.log('\n📊 Anti-Bot Analysis Results:');
    console.log('═'.repeat(60));
    console.log(`  Cloudflare:       ${result.cloudflare ? '✓ Detected' : '✗ Not detected'}`);
    console.log(`  reCAPTCHA:        ${result.recaptcha ? '✓ Detected' : '✗ Not detected'}`);
    console.log(`  hCAPTCHA:         ${result.hcaptcha ? '✓ Detected' : '✗ Not detected'}`);
    console.log(`  Canvas FP:        ${result.canvas ? '✓ Detected' : '✗ Not detected'}`);
    console.log(`  WebRTC FP:        ${result.webrtc ? '✓ Detected' : '✗ Not detected'}`);
    console.log(`  WebDriver:        ${result.webdriver ? '✓ Exposed' : '✗ Not exposed'}`);
    
    console.log('\n  Fingerprinting Techniques:');
    console.log(`    User-Agent:     ${result.fingerprinting.userAgent ? '✓' : '✗'}`);
    console.log(`    Languages:      ${result.fingerprinting.languages ? '✓' : '✗'}`);
    console.log(`    Plugins:        ${result.fingerprinting.plugins ? '✓' : '✗'}`);
    console.log(`    Fonts:          ${result.fingerprinting.fonts ? '✓' : '✗'}`);
    console.log(`    Screen:         ${result.fingerprinting.screen ? '✓' : '✗'}`);
    console.log(`    Timezone:       ${result.fingerprinting.timezone ? '✓' : '✗'}`);
    console.log(`    Hardware:       ${result.fingerprinting.hardware ? '✓' : '✗'}`);

    if (result.suspiciousScripts.length > 0) {
      console.log(`\n  Suspicious Scripts: ${result.suspiciousScripts.length}`);
      result.suspiciousScripts.slice(0, 5).forEach(s => {
        console.log(`    - ${s.url} (${s.reason})`);
      });
    }

    console.log('═'.repeat(60));
  }
}
