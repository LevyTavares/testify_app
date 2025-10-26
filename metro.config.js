// Metro configuration for Expo
// Adds support for loading .wasm assets used by expo-sqlite on Web
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure WebAssembly files are treated as assets
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts || []), "wasm"])
);

// Some packages still publish .cjs files
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), "cjs"])
);

module.exports = config;
