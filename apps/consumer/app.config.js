/**
 * Extends app.json. The Android Google Maps SDK key is a build-time setting read from
 * GOOGLE_MAPS_ANDROID_API_KEY; it is never committed. iOS uses the platform map and needs no key.
 */
module.exports = ({ config }) => {
  const androidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-maps',
        androidKey ? { androidGoogleMapsApiKey: androidKey } : {},
      ],
    ],
  };
};
