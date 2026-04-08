import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drive7i.app',
  appName: 'App7i',
  webDir: 'build',
  server: {
    // Remove this block for production store builds.
    // Uncomment ONLY for live-reload testing on a real device:
    // url: 'http://YOUR_LOCAL_IP:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f2150',
      showSpinner: false,
    },
  },
};

export default config;
