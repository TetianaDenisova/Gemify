// Dynamic config on top of app.json.
// Build the demo variant by setting APP_VARIANT=demo (see eas.json profiles).
const IS_DEMO = process.env.APP_VARIANT === 'demo';

// 1024x1024 builds of assets/images/icon-personal.png. The adaptive variant
// shrinks the art into the launcher mask's safe zone (padded with #050811) so
// Android's circular crop doesn't cut the castle spire.
const PERSONAL_ICON = './assets/images/icon-personal-1024.png';
const PERSONAL_ICON_ADAPTIVE = './assets/images/icon-personal-adaptive.png';

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
          foregroundImage: PERSONAL_ICON_ADAPTIVE,
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
