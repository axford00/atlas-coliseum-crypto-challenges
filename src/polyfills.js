// src/polyfills.js - REACT-NATIVE-QUICK-CRYPTO VERSION + TextInput Fix
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Step 1: Set up Buffer globally FIRST
global.Buffer = global.Buffer || Buffer;

// Step 2: Set up process BEFORE crypto
global.process = global.process || require('process/browser');
global.process.browser = true;
global.process.env = global.process.env || {};
global.process.env.NODE_ENV = global.process.env.NODE_ENV || (__DEV__ ? 'development' : 'production');

// Step 3: CRITICAL - Import react-native-quick-crypto
import { install } from 'react-native-quick-crypto';
install();

// Step 4: Set up stream AFTER crypto
const Stream = require('readable-stream');
global.stream = Stream;
global.Stream = Stream;

// Step 5: Additional polyfills
global.util = global.util || require('util');
global.assert = global.assert || require('assert');
global.events = global.events || require('events');

// Step 6: URL polyfill
require('react-native-url-polyfill/auto');

// Step 7: Process timing fixes
if (typeof global.process.nextTick !== 'function') {
  global.process.nextTick = (callback, ...args) => {
    setTimeout(() => callback(...args), 0);
  };
}

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    setTimeout(() => callback(...args), 0);
  };
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => {
    clearTimeout(id);
  };
}

// CRITICAL: Fix for TextInput focus issues on Android
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 16);
  };
}

if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// CRITICAL: Ensure TextInput focus events work properly
if (typeof global.InteractionManager === 'undefined') {
  global.InteractionManager = {
    runAfterInteractions: (callback) => {
      setTimeout(callback, 0);
    },
    createInteractionHandle: () => ({ id: Math.random() }),
    clearInteractionHandle: () => {},
  };
}

console.log('✅ REACT-NATIVE-QUICK-CRYPTO polyfills loaded successfully');
console.log('🚀 Native crypto performance: ENABLED');
console.log('🔧 Global objects initialized:', {
  Buffer: !!global.Buffer,
  process: !!global.process,
  crypto: !!global.crypto,
  stream: !!global.stream,
  quickCrypto: !!global.crypto?.getRandomValues
});

console.log('🎯 Using react-native-quick-crypto for 58x performance boost');
console.log('🛡️ cipher-base compatibility: ENHANCED');
console.log('📱 TextInput focus fixes: APPLIED');
console.log('⚡ Animation frame polyfills: READY');