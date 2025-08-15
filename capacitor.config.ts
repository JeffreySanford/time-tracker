import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.truenorth.timetracker',
  appName: 'Time Tracker',
  webDir: 'dist/apps/time-tracker/browser',
  server: {
    // Use 10.0.2.2 for Android emulator to access host machine's localhost
    url: 'http://10.0.2.2:4200',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
