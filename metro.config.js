// metro.config.js - REACT-NATIVE-QUICK-CRYPTO VERSION for Solana Mobile
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// CRITICAL: Use react-native-quick-crypto instead of crypto-browserify
config.resolver.alias = {
  ...config.resolver.alias,
  
  // HIGH-PERFORMANCE NATIVE CRYPTO
  'crypto': 'react-native-quick-crypto',
  'stream': require.resolve('readable-stream'),
  'buffer': require.resolve('buffer'),
  
  // Additional Node.js polyfills
  'process': require.resolve('process/browser'),
  'util': require.resolve('util'),
  'events': require.resolve('events'),
  'assert': require.resolve('assert'),
  'path': require.resolve('path-browserify'),
  
  // CRITICAL: This should fix cipher-base
  'cipher-base': require.resolve('cipher-base'),
  
  // Solana dependencies
  'rpc-websockets': require.resolve('rpc-websockets'),
};

// Enable package exports for Mobile Wallet Adapter
config.resolver.unstable_enablePackageExports = true;

// Support native platforms
config.resolver.platforms = [
  'native',
  'android', 
  'ios',
  ...config.resolver.platforms
];

// Enhanced source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs'
];

// Resolver main fields
config.resolver.resolverMainFields = [
  'react-native',
  'browser', 
  'main'
];

// Transformer configuration
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

console.log('✅ Metro config loaded with react-native-quick-crypto');
console.log('🚀 Native crypto performance enabled');

module.exports = config;