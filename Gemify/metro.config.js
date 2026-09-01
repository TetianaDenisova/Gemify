const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  // "wasm" is required by expo-sqlite on web.
  assetExts: [...config.resolver.assetExts, "wasm"],
};

// expo-sqlite's web worker needs SharedArrayBuffer, which browsers only
// enable under cross-origin isolation.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    middleware(req, res, next);
  },
};

module.exports = config;
