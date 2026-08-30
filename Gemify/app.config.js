// Dynamic config on top of app.json.
// Build the demo variant by setting APP_VARIANT=demo (see eas.json profiles).
const IS_DEMO = process.env.APP_VARIANT === 'demo';

// Square 1024x1024 build of assets/images/personal-icon.png (padded with #050811).
const PERSONAL_ICON = './assets/images/personal-icon-1024.png';

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEMO ? 'Gemify Demo' : 'Gemify',
  scheme: IS_DEMO ? 'gemify-demo' : 'gemify',
  icon: IS_DEMO ? config.icon : PERSONAL_ICON,
  android: {
    ...config.android,
    package: IS_DEMO ? 'com.gemify.demo' : 'com.gemify.app',
    adaptiveIcon: IS_DEMO
      ? config.android.adaptiveIcon
      : {
          ...config.android.adaptiveIcon,
          foregroundImage: PERSONAL_ICON,
        },
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
