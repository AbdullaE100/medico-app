export default {
  name: 'Medical Network',
  slug: 'medical-network',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'medico',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.medical.network',
    associatedDomains: ["applinks:auth.medico-app.com", "applinks:cslxbdtaxirqfozfvjhg.supabase.co"]
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.medical.network',
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "auth.medico-app.com",
            pathPrefix: "/redirect"
          },
          {
            scheme: "https",
            host: "cslxbdtaxirqfozfvjhg.supabase.co",
            pathPrefix: "/auth/v1/callback"
          },
          {
            scheme: "medico",
            host: "auth",
            pathPrefix: "/callback"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router'
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleClientId: '747216005042-v9de9l8vqkm308q1q0rfofskeerbotjq.apps.googleusercontent.com',
    router: {
      origin: false
    },
    eas: {
      projectId: 'your-project-id'
    }
  }
};