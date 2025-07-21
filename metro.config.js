// metro.config.js - REPLACE your existing metro config with this:
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for Solana dependencies
config.resolver.alias = {
  ...config.resolver.alias,
  'crypto': require.resolve('crypto-browserify'),
  'stream': require.resolve('readable-stream'),
  'buffer': require.resolve('buffer'),
  'process': require.resolve('process/browser'),
  'util': require.resolve('util'),
};

// Ensure proper module resolution
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
  './node_modules'
];

// Add source extensions for Solana modules
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs'
];

// CRITICAL: Add native module support for MWA
config.resolver.platforms = [
  'native',
  'android',
  'ios',
  ...config.resolver.platforms
];

// Configure transformer for better compatibility
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  // Add support for native modules
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Add experimental features for native modules
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main'
];

module.exports = config;