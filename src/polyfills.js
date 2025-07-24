// src/polyfills.js - WEB COMPATIBLE VERSION
// CRITICAL: Import order matters for Solana Mobile Wallet Adapter

import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Step 1: Set up Buffer globally FIRST
global.Buffer = global.Buffer || Buffer;

// Step 2: Set up process BEFORE stream (cipher-base needs this)
global.process = global.process || require('process');
global.process.browser = true;
global.process.env = global.process.env || {};
global.process.env.NODE_ENV = global.process.env.NODE_ENV || 'development';

// Step 3: CRITICAL - Set up stream BEFORE crypto (fixes cipher-base)
const Stream = require('readable-stream');
global.stream = Stream;
global.Stream = Stream;

// Step 4: Now crypto can safely load with proper stream support
global.crypto = global.crypto || require('crypto-browserify');

// Step 5: Additional polyfills needed by @solana/web3.js
global.util = global.util || require('util');
global.assert = global.assert || require('assert');
global.events = global.events || require('events');

// Step 6: URL polyfill for React Native
require('react-native-url-polyfill/auto');

// Step 7: Fix process.nextTick - WEB COMPATIBLE VERSION
if (typeof global.process.nextTick !== 'function') {
  // Use setTimeout instead of setImmediate for web compatibility
  global.process.nextTick = (callback, ...args) => {
    setTimeout(() => callback(...args), 0);
  };
}

// Step 8: Add setImmediate polyfill for web
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    setTimeout(() => callback(...args), 0);
  };
}

// Step 9: Add clearImmediate polyfill for web
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => {
    clearTimeout(id);
  };
}

console.log('✅ WEB-COMPATIBLE Solana polyfills loaded successfully');
console.log('🔧 Global objects initialized:', {
  Buffer: !!global.Buffer,
  process: !!global.process,
  crypto: !!global.crypto,
  stream: !!global.stream,
  Stream: !!global.Stream,
  util: !!global.util,
  URL: !!global.URL,
  nextTick: !!global.process.nextTick,
  setImmediate: !!global.setImmediate
});

console.log('🎯 Stream type:', typeof global.stream);
console.log('🌐 Web compatibility: setImmediate polyfilled');
console.log('🎯 Using readable-stream for cipher-base compatibility');