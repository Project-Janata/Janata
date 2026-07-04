const { expo } = require('./app.json')

const androidMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
  process.env.GOOGLE_MAPS_ANDROID_API_KEY ||
  ''

module.exports = {
  ...expo,
  android: {
    ...expo.android,
    config: {
      ...(expo.android && expo.android.config ? expo.android.config : {}),
      ...(androidMapsApiKey
        ? {
            googleMaps: {
              apiKey: androidMapsApiKey,
            },
          }
        : {}),
    },
  },
  extra: {
    ...expo.extra,
    googleMapsAndroidApiKeyPresent: Boolean(androidMapsApiKey),
  },
}
