import "dotenv/config";

export default {
  expo: {
    name: process.env.APP_NAME || "TempoUp",
    slug: process.env.APP_SLUG || "tempoup",
    version: process.env.APP_VERSION || "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",

    splash: {
      resizeMode: "contain",
      backgroundColor: "#1E3A8A",
    },

    assetBundlePatterns: ["**/*"],

    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.IOS_BUNDLE_ID || "com.tempoup.mobile",
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          'TempoUp needs access to your photos so you can set a profile picture.',
      },
    },

    android: {
      package: process.env.ANDROID_PACKAGE || "com.tempoup.mobile",
      adaptiveIcon: {
        backgroundColor: "#1E3A8A",
      },
    },

    web: {
      bundler: "metro",
    },

    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL,
      cloudinaryCloudName: 
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: 
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    },
  },
};