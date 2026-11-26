
module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];

  // Evitar registrar expo-build-properties dos veces.
  const pluginName = "expo-build-properties";

  const pluginIndex = plugins.findIndex(
    (plugin) =>
      (Array.isArray(plugin) ? plugin[0] : plugin) === pluginName
  );

  // Conservar las opciones que ya pudiera tener el plugin.
  const previousPlugin =
    pluginIndex >= 0 ? plugins[pluginIndex] : undefined;

  const previousOptions = Array.isArray(previousPlugin)
    ? previousPlugin[1] ?? {}
    : {};

  const previousAndroid = previousOptions.android ?? {};
  const previousPackaging = previousAndroid.packagingOptions ?? {};

  const previousExclude = Array.isArray(previousPackaging.exclude)
    ? previousPackaging.exclude
    : previousPackaging.exclude
      ? [previousPackaging.exclude]
      : [];

  const buildPropertiesPlugin = [
    pluginName,
    {
      ...previousOptions,
      android: {
        ...previousAndroid,
        packagingOptions: {
          ...previousPackaging,
          exclude: [
            ...new Set([
              ...previousExclude,
              "META-INF/DEPENDENCIES",
            ]),
          ],
        },
      },
    },
  ];

  if (pluginIndex >= 0) {
    plugins[pluginIndex] = buildPropertiesPlugin;
  } else {
    plugins.push(buildPropertiesPlugin);
  }

  return {
    ...config,

    plugins,

    android: {
      ...config.android,

      // Configuración de Firebase para Android.
      googleServicesFile: "./google-services.json",

      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      },
    },
  };
};
