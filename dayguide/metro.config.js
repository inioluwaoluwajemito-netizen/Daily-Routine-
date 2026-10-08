const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable WASM support for expo-sqlite web worker
config.resolver.assetExts.push('wasm');

module.exports = config;
