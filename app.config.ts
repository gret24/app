import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'IceIQ',
  slug: 'iceiq',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'iceiq',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A0F',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.iceiq.app',
    infoPlist: {
      NSCameraUsageDescription: '하이라이트 드로잉 공유를 위해 카메라를 사용합니다.',
      NSPhotoLibraryUsageDescription: '영상 업로드 및 드로잉 저장을 위해 사진 라이브러리 접근이 필요합니다.',
      NSPhotoLibraryAddUsageDescription: '드로잉 이미지를 갤러리에 저장하기 위해 접근이 필요합니다.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0F',
    },
    package: 'com.iceiq.app',
    versionCode: 1,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',

    [
      'expo-image-picker',
      {
        photosPermission: '영상 분석을 위해 사진 라이브러리 접근이 필요합니다.',
        cameraPermission: '카메라 접근이 필요합니다.',
      },
    ],
    [
      'expo-av',
      { microphonePermission: false },
    ],
  ],
  extra: {
    // 환경변수 (빌드 시 주입)
    apiUrl: process.env.API_URL ?? 'http://216.81.151.44:8000',
    environment: process.env.APP_ENV ?? 'development',
    eas: {
      projectId: 'c4d1fab2-919a-4e03-9028-2eb17e0ad739',
    },
  },
  owner: 'gret24',
});
