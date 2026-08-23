// Dynamic config on top of app.json.
// Build the demo variant by setting APP_VARIANT=demo (see eas.json profiles).
const IS_DEMO = process.env.APP_VARIANT === 'demo';

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEMO ? 'Gemify Demo' : 'Gemify',
  scheme: IS_DEMO ? 'gemify-demo' : 'gemify',
  android: {
    ...config.android,
    package: IS_DEMO ? 'com.gemify.demo' : 'com.gemify.app',
  },
  ios: {
    ...config.ios,
    bundleIdentifier: IS_DEMO ? 'com.gemify.demo' : 'com.gemify.app',
  },
  extra: {
    ...config.extra,
    appVariant: IS_DEMO ? 'demo' : 'personal',
  },
});
