const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = config.resolver;

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};

config.resolver = {
  ...config.resolver,
  // "wasm" is required by expo-sqlite on web.
  assetExts: [...assetExts.filter((extension) => extension !== "svg"), "wasm"],
  sourceExts: [...sourceExts, "svg"],
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
