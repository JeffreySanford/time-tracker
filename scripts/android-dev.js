#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Set up environment variables for Android development
const env = { ...process.env };

// Set JAVA_HOME to Android Studio's bundled JDK
if (os.platform() === 'win32') {
  env.JAVA_HOME = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  env.ANDROID_HOME = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
} else {
  // For macOS/Linux
  env.JAVA_HOME = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
  env.ANDROID_HOME = path.join(os.homedir(), 'Library', 'Android', 'sdk');
}

// Update PATH to include Android tools
const pathSeparator = os.platform() === 'win32' ? ';' : ':';
env.PATH = [
  path.join(env.JAVA_HOME, 'bin'),
  path.join(env.ANDROID_HOME, 'platform-tools'),
  path.join(env.ANDROID_HOME, 'tools'),
  env.PATH
].join(pathSeparator);

console.log('🔧 Setting up Android development environment...');
console.log('📱 JAVA_HOME:', env.JAVA_HOME);
console.log('📱 ANDROID_HOME:', env.ANDROID_HOME);
console.log('');

// Wait 8 seconds for servers to start, then launch Android
console.log('⏳ Waiting 8 seconds for frontend and backend to start...');
setTimeout(() => {
  console.log('🚀 Launching Android app with live reload...');
  console.log('📱 Target device: Pixel 9 Pro (Pixel_9_Pro)');
  console.log('🔗 Connecting to: http://10.0.2.2:4200');
  console.log('');
  // Use the full node_modules path to ensure npx is found
  const npxPath = os.platform() === 'win32' ? 
    path.join(process.cwd(), 'node_modules', '.bin', 'cap.cmd') :
    path.join(process.cwd(), 'node_modules', '.bin', 'cap');
  
  const capacitor = spawn(npxPath, [
    'run', 'android', 
    '--target=Pixel_9_Pro',
    '--live-reload', 
    '--host=10.0.2.2', 
    '--port=4200'
  ], {
    stdio: 'inherit',
    env: env,
    shell: true
  });

  capacitor.on('error', (error) => {
    console.error('❌ Error launching Android app:', error.message);
    // Fallback to npx if direct path fails
    console.log('🔄 Trying fallback method...');
    spawn('npx', [
      'cap', 'run', 'android',
      '--target=Pixel_9_Pro',
      '--live-reload',
      '--host=10.0.2.2',
      '--port=4200'
    ], {
      stdio: 'inherit',
      env: env,
      shell: true
    });
  });

  capacitor.on('close', (code) => {
    console.log(`📱 Android app process exited with code ${code}`);
  });

}, 8000);
