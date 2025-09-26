#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Set up environment variables for Android development
const env = { ...process.env };

// Set JAVA_HOME to Android Studio's bundled JDK (Java 21)
if (os.platform() === 'win32') {
  env.JAVA_HOME = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  env.ANDROID_HOME = path.join(
    os.homedir(),
    'AppData',
    'Local',
    'Android',
    'Sdk'
  );
  // Check if ANDROID_HOME exists and has platform-tools
  const fs = require('fs');
  const sdkPath = env.ANDROID_HOME;
  const platformToolsPath = path.join(sdkPath, 'platform-tools');
  if (!fs.existsSync(sdkPath) || !fs.existsSync(platformToolsPath)) {
    console.warn('⚠️ Android SDK not found at', sdkPath);
    console.warn(
      'Attempting to install Android SDK platform-tools using sdkmanager...'
    );
    // Try to run sdkmanager if available
    const sdkManagerPath = path.join(
      sdkPath,
      'cmdline-tools',
      'latest',
      'bin',
      'sdkmanager.bat'
    );
    if (fs.existsSync(sdkManagerPath)) {
      const installSdk = spawn(
        sdkManagerPath,
        ['platform-tools', 'platforms;android-34', 'build-tools;34.0.0'],
        {
          stdio: 'inherit',
          env: env,
          shell: true,
        }
      );
      installSdk.on('close', (code) => {
        if (code !== 0) {
          console.error(
            '❌ Failed to install Android SDK components. Please install Android Studio and set up the SDK manually.'
          );
          process.exit(1);
        } else {
          console.log(
            '✅ Android SDK components installed. Please re-run your command.'
          );
          process.exit(0);
        }
      });
      // Stop further execution until SDK is installed
      return;
    } else {
      console.error(
        '❌ sdkmanager not found. Please install Android Studio and set up the SDK manually.'
      );
      process.exit(1);
    }
  }
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
  env.PATH,
].join(pathSeparator);

console.log('🔧 Setting up Android development environment...');
console.log('📱 JAVA_HOME:', env.JAVA_HOME);
console.log('📱 ANDROID_HOME:', env.ANDROID_HOME);
console.log('');

// Wait 8 seconds for servers to start, then launch Android
console.log('⏳ Waiting 8 seconds for frontend and backend to start...');
setTimeout(() => {
  // Build frontend before copying Capacitor assets
  console.log('�️ Building frontend for Android...');
  const buildFrontend = spawn('npm', ['run', 'build:frontend'], {
    stdio: 'inherit',
    env: env,
    shell: true,
  });

  buildFrontend.on('close', (buildCode) => {
    if (buildCode !== 0) {
      console.error('❌ Frontend build failed. Android app will not launch.');
      return;
    }
    console.log('🔄 Copying Capacitor assets to Android project...');
    const copyProcess = spawn('npx', ['cap', 'copy', 'android'], {
      stdio: 'inherit',
      env: env,
      shell: true,
    });

    copyProcess.on('close', (copyCode) => {
      if (copyCode !== 0) {
        console.error(
          '❌ Failed to copy Capacitor assets. Android app will not launch.'
        );
        return;
      }
      console.log('🚀 Launching Android app with live reload...');
      console.log('📱 Target device: Pixel 9 Pro (Pixel_9_Pro)');
      console.log('🔗 Connecting to: http://10.0.2.2:4200');
      console.log('');
      // Use the full node_modules path to ensure npx is found
      const npxPath =
        os.platform() === 'win32'
          ? path.join(process.cwd(), 'node_modules', '.bin', 'cap.cmd')
          : path.join(process.cwd(), 'node_modules', '.bin', 'cap');
      const capacitor = spawn(
        npxPath,
        [
          'run',
          'android',
          '--target=Pixel_9_Pro',
          '--live-reload',
          '--host=10.0.2.2',
          '--port=4200',
        ],
        {
          stdio: 'inherit',
          env: env,
          shell: true,
        }
      );
      capacitor.on('error', (error) => {
        console.error('❌ Error launching Android app:', error.message);
        // Fallback to npx if direct path fails
        console.log('🔄 Trying fallback method...');
        spawn(
          'npx',
          [
            'cap',
            'run',
            'android',
            '--target=Pixel_9_Pro',
            '--live-reload',
            '--host=10.0.2.2',
            '--port=4200',
          ],
          {
            stdio: 'inherit',
            env: env,
            shell: true,
          }
        );
      });
      capacitor.on('close', (code) => {
        console.log(`📱 Android app process exited with code ${code}`);
      });
    });
  });
}, 8000);
