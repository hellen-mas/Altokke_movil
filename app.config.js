module.exports = ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: "./google-services.json",
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_API_KEY ||
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
            "",
        },
      },
    },
  };
};
