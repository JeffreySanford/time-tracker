import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.truenorth.timetracker',
  appName: 'Time Tracker',
  webDir: 'dist/apps/time-tracker/browser',
  // DEV ONLY: Uncomment the following for live reload during development
  // server: { url: 'http://localhost:4200', cleartext: true }
};
export default config;
