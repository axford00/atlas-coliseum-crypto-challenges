// metro.config.js - FIXED for Solana Mobile Wallet Adapter bundling
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// CRITICAL FIX: Proper polyfill aliases for cipher-base compatibility
config.resolver.alias = {
  ...config.resolver.alias,
  // Crypto polyfills
  'crypto': require.resolve('crypto-browserify'),
  'stream': require.resolve('readable-stream'), // CRITICAL: readable-stream not stream-browserify
  'buffer': require.resolve('buffer'),
  'process': require.resolve('process/browser'),
  
  // Additional Node.js polyfills for @solana/web3.js
  'util': require.resolve('util'),
  'events': require.resolve('events'),
  'assert': require.resolve('assert'),
  'path': require.resolve('path-browserify'),
  'url': require.resolve('react-native-url-polyfill'),
  
  // CRITICAL: Ensure cipher-base uses our stream polyfill
  'cipher-base': require.resolve('cipher-base'),
  
  // Additional fixes for common Solana dependencies
  'rpc-websockets': require.resolve('rpc-websockets'),
};

// Enable package exports for Mobile Wallet Adapter (CRITICAL)
config.resolver.unstable_enablePackageExports = true;

// Support native platforms for MWA
config.resolver.platforms = [
  'native',
  'android', 
  'ios',
  ...config.resolver.platforms
];

// Add source extensions for modern JS modules
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs'
];

// Configure resolver main fields for better compatibility
config.resolver.resolverMainFields = [
  'react-native',
  'browser', 
  'main'
];

// Configure transformer for native modules
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// CRITICAL: Ensure proper node modules resolution
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
  './node_modules'
];

console.log('✅ Metro config loaded with Solana Mobile support');
console.log('🔧 Stream alias:', config.resolver.alias.stream);
console.log('🔧 Package exports enabled:', config.resolver.unstable_enablePackageExports);

module.exports = config;