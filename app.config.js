module.exports = ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,

      // Configuración de Firebase para Android 
      googleServicesFile: "./google-services.json",
      
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      },
    },
  };
};
