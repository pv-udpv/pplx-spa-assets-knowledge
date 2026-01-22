/**
 * Configuration for browser data capture
 */

import type { CaptureConfig } from '../types/index.js';

export const defaultCaptureConfig: CaptureConfig = {
  timeout: 30000,
  headless: true,
  capture: {
    har: true,
    network: true,
    websocket: true,
    sse: true,
    callstack: true,
    storage: true,
    cookies: true,
    console: true,
    domSnapshot: false,
    performance: true,
  },
  chrome: {
    port: 9222,
    host: 'localhost',
  },
  extension: {
    enabled: true,
    path: './ext/pplx-capture',
    autoLoad: true,
  },
  output: {
    dir: './captures',
    format: 'json',
    compress: false,
  },
};

/**
 * Presets for common scenarios
 */
export const capturePresets = {
  /**
   * Minimal: Only HAR and network timings
   */
  minimal: {
    ...defaultCaptureConfig,
    capture: {
      har: true,
      network: true,
      websocket: false,
      sse: false,
      callstack: false,
      storage: false,
      cookies: false,
      console: false,
      domSnapshot: false,
      performance: false,
    },
  } as CaptureConfig,

  /**
   * API Reverse Engineering: HAR, network, WebSocket, storage
   */
  apiReversing: {
    ...defaultCaptureConfig,
    capture: {
      har: true,
      network: true,
      websocket: true,
      sse: true,
      callstack: false,
      storage: true,
      cookies: true,
      console: false,
      domSnapshot: false,
      performance: true,
    },
  } as CaptureConfig,

  /**
   * Full: Everything
   */
  full: {
    ...defaultCaptureConfig,
    capture: {
      har: true,
      network: true,
      websocket: true,
      sse: true,
      callstack: true,
      storage: true,
      cookies: true,
      console: true,
      domSnapshot: true,
      performance: true,
    },
  } as CaptureConfig,

  /**
   * Development: For debugging and development
   */
  development: {
    ...defaultCaptureConfig,
    headless: false,
    capture: {
      har: true,
      network: true,
      websocket: true,
      sse: true,
      callstack: true,
      storage: true,
      cookies: true,
      console: true,
      domSnapshot: true,
      performance: true,
    },
  } as CaptureConfig,
};
