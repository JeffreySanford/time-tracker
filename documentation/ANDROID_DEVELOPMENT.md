# Android Development Setup & Deployment Guide

This guide documents the complete process for developing and deploying the Time Tracker Angular application to Android devices using Capacitor and VS Code.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Project Configuration](#project-configuration)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Development Workflow](#development-workflow)
- [Common Issues & Solutions](#common-issues--solutions)
- [VS Code Integration](#vs-code-integration)
- [Testing & Debugging](#testing--debugging)

## Prerequisites

### Required Software
- **Node.js**: Latest LTS version
- **Android Studio**: Latest version
- **Java Development Kit (JDK)**: Version 17 (OpenJDK Temurin recommended)
- **VS Code**: With recommended extensions
- **Git**: For version control

### Android Studio Setup
1. Install Android Studio from [developer.android.com](https://developer.android.com/studio)
2. During installation, ensure these components are selected:
   - Android SDK
   - Android SDK Platform-Tools
   - Android Virtual Device (AVD)
3. Set up at least one Android Virtual Device (AVD) for testing

### Java 17 Installation
The project requires Java 17. If you encounter Java version conflicts:

```bash
# Check your Java version
java --version

# Should show something like:
# openjdk 17.0.16 2025-07-15
# OpenJDK Runtime Environment Temurin-17.0.16+8 (build 17.0.16+8)
# OpenJDK 64-Bit Server VM Temurin-17.0.16+8 (build 17.0.16+8, mixed mode, sharing)
```

**Installation Sources:**
- [Eclipse Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17)
- [OpenJDK 17](https://openjdk.org/projects/jdk/17/)

## Initial Setup

### 1. Project Dependencies
Ensure all Capacitor dependencies are installed:

```bash
# Navigate to project root
cd /path/to/time-tracker

# Install dependencies
npm install

# Verify Capacitor CLI
npx cap --version
```

### 2. Capacitor Configuration
The main configuration file is `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourco.timetracker',
  appName: 'Time Tracker',
  webDir: 'dist/apps/time-tracker/browser',
  
  // For production builds (recommended for initial setup)
  // server: { url: 'http://localhost:4200', cleartext: true }
  
  // For live reload development (advanced)
  // server: { url: 'http://localhost:4200', cleartext: true }
};

export default config;
```

**Configuration Notes:**
- `appId`: Android package identifier (must be unique)
- `appName`: Display name for the app
- `webDir`: Path to built Angular application
- `server`: Only needed for live reload development

### 3. Android Platform Setup
Initialize the Android platform:

```bash
# Add Android platform
npx cap add android

# Sync web assets to Android
npx cap sync android
```

## Project Configuration

### Android Gradle Configuration
Due to Java version requirements, specific Gradle configurations were needed:

#### File: `android/app/build.gradle`
```gradle
android {
    namespace "com.yourco.timetracker"
    compileSdk rootProject.ext.compileSdkVersion
    
    // Java 17 compatibility settings
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    defaultConfig {
        applicationId "com.yourco.timetracker"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### File: `android/build.gradle`
```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
    }
    
    // Ensure all modules use Java 17
    afterEvaluate {
        if (it.hasProperty('android')) {
            android {
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
    }
}
```

## Development Workflow

### Method 1: Standalone Build (Recommended for Beginners)
This method builds a complete APK that doesn't require network connectivity:

```bash
# 1. Build the Angular application
nx build time-tracker --configuration=production

# 2. Sync assets to Android
npx cap sync android

# 3. Build and deploy to emulator
npx cap run android

# Alternative: Open in Android Studio
npx cap open android
```

**Advantages:**
- ✅ No network configuration needed
- ✅ Faster app startup
- ✅ Works offline
- ✅ More reliable for testing

**Disadvantages:**
- ❌ Must rebuild for every change
- ❌ No live reload

### Method 2: Live Reload Development (Advanced)
This method connects the Android app to your local development server for live updates:

#### Step 1: Configure for Live Reload
Edit `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  // ... other config
  server: { url: 'http://localhost:4200', cleartext: true }
};
```

#### Step 2: Start Development Server
```bash
# Start with host binding for external access
nx serve time-tracker --host 0.0.0.0
```

#### Step 3: Set Up Port Forwarding
```bash
# Use full path to adb (adjust path as needed)
"C:\Users\[USERNAME]\AppData\Local\Android\Sdk\platform-tools\adb.exe" reverse tcp:4200 tcp:4200
```

#### Step 4: Deploy and Test
```bash
npx cap sync android
npx cap run android
```

## Troubleshooting Guide

### Java Version Issues
**Problem**: `error: invalid source release: 21`

**Solution**: 
1. Verify Java 17 is installed: `java --version`
2. Update Gradle configurations (see [Project Configuration](#project-configuration))
3. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx cap sync android
   ```

### Network Connectivity Issues
**Problem**: `net::ERR_CONNECTION_REFUSED` or `net::ERR_CONNECTION_TIMED_OUT`

**Solutions**:
1. **Use Standalone Build** (recommended):
   ```bash
   # Comment out server config in capacitor.config.ts
   # server: { url: 'http://localhost:4200', cleartext: true }
   ```

2. **Fix Port Forwarding**:
   ```bash
   # Set up ADB port forwarding
   adb reverse tcp:4200 tcp:4200
   
   # Verify dev server is accessible
   curl -I http://localhost:4200
   ```

3. **Try Alternative IP Addresses**:
   - `http://10.0.2.2:4200` (standard Android emulator)
   - `http://192.168.1.XXX:4200` (your network IP)

### ADB Device Authorization Issues
**Problem**: `adb.exe: device still authorizing`

**Solutions**:
1. **Accept authorization on emulator**: Look for popup dialog
2. **Restart ADB**:
   ```bash
   adb kill-server
   adb start-server
   ```
3. **Manual app launch**:
   ```bash
   adb shell am start -n com.yourco.timetracker/com.yourco.timetracker.MainActivity
   ```

### Build Failures
**Problem**: Gradle build failures

**Solutions**:
1. **Clean build**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```
2. **Check Android SDK**: Ensure all required components are installed
3. **Verify file permissions**: Ensure `gradlew` is executable

## VS Code Integration

### Recommended Extensions
Install these VS Code extensions for optimal Android development:

```bash
# Extension IDs for installation
code --install-extension diemasmichiels.emulate
code --install-extension msjsdiag.cordova-tools
```

**Extensions:**
- **Android iOS Emulator** (`diemasmichiels.emulate`): Manage emulators from VS Code
- **Cordova Tools** (`msjsdiag.cordova-tools`): Debugging and integrated commands

### VS Code Tasks Configuration
Create `.vscode/tasks.json` for quick build commands:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build Android App",
      "type": "shell",
      "command": "nx build time-tracker && npx cap sync android",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Deploy to Android",
      "type": "shell",
      "command": "nx build time-tracker && npx cap sync android && npx cap run android",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Open in Android Studio",
      "type": "shell",
      "command": "npx cap open android",
      "group": "build",
      "problemMatcher": []
    }
  ]
}
```

## Testing & Debugging

### Device Testing Options
1. **Android Emulator** (recommended for development)
   - Fast iteration
   - Easy debugging
   - Multiple device configurations

2. **Physical Device** (for final testing)
   - Enable Developer Options
   - Enable USB Debugging
   - Connect via USB

### Debugging Tools
1. **Chrome DevTools**:
   ```
   chrome://inspect/#devices
   ```
   
2. **Android Studio Logcat**:
   ```bash
   npx cap open android
   # Use Android Studio's Logcat for detailed logs
   ```

3. **VS Code Debugging**:
   - Set breakpoints in TypeScript code
   - Use Cordova Tools extension for debugging

### Testing Checklist
Before deploying to production:

- [ ] Test on multiple screen sizes
- [ ] Verify touch interactions work properly
- [ ] Test offline functionality
- [ ] Check performance on lower-end devices
- [ ] Validate all features work without network
- [ ] Test app lifecycle (pause/resume)

## Common Issues & Solutions

### Issue: White Screen on Launch
**Cause**: App trying to connect to development server

**Solution**: Use standalone build mode:
```typescript
// In capacitor.config.ts, comment out:
// server: { url: 'http://localhost:4200', cleartext: true }
```

### Issue: App Crashes on Startup
**Cause**: Usually Java version incompatibility

**Solution**: 
1. Verify Java 17 installation
2. Update Gradle configurations
3. Clean and rebuild

### Issue: Changes Not Reflected
**Cause**: Not rebuilding Angular app

**Solution**:
```bash
# Always rebuild Angular before syncing
nx build time-tracker
npx cap sync android
```

### Issue: Emulator Not Detected
**Cause**: ADB not finding emulator

**Solution**:
```bash
# List available devices
adb devices

# Start emulator manually from Android Studio
# Or use AVD Manager
```

## Performance Optimization

### Build Size Optimization
The current build shows warnings about bundle size:
- Main bundle: ~551KB (target: <500KB)
- Styles: ~22.6KB (target: <20KB)

**Optimization strategies:**
1. **Code splitting**: Implement lazy loading
2. **Tree shaking**: Remove unused imports
3. **Minification**: Ensure production build optimizations
4. **Asset optimization**: Compress images and icons

### Runtime Performance
1. **Use OnPush change detection** for better performance
2. **Implement virtual scrolling** for large lists
3. **Optimize images** for mobile devices
4. **Use Capacitor plugins** for native functionality

## Deployment to Production

### APK Generation
```bash
# Build production APK
nx build time-tracker --configuration=production
npx cap sync android
cd android
./gradlew assembleRelease
```

### App Signing (for Play Store)
1. Generate signing key
2. Configure `build.gradle` with signing config
3. Build signed APK
4. Upload to Google Play Console

### App Store Preparation
- [ ] Update app icons
- [ ] Configure splash screens
- [ ] Set proper app metadata
- [ ] Test on multiple devices
- [ ] Prepare store listings

## Maintenance & Updates

### Regular Maintenance Tasks
1. **Update dependencies**:
   ```bash
   npm update
   npx cap sync android
   ```

2. **Update Capacitor**:
   ```bash
   npm install @capacitor/core@latest @capacitor/cli@latest
   npx cap sync android
   ```

3. **Android SDK updates**: Keep Android Studio updated

### Version Management
- Update `versionCode` and `versionName` in `build.gradle`
- Tag releases in Git
- Maintain changelog

## Resources & References

### Official Documentation
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Angular Mobile Development](https://angular.io/guide/deployment#building-and-serving-for-deployment)
- [Android Developer Guide](https://developer.android.com/guide)

### Useful Commands Reference
```bash
# Capacitor Commands
npx cap add android                 # Add Android platform
npx cap sync android               # Sync web assets
npx cap run android                # Build and deploy
npx cap open android               # Open in Android Studio
npx cap ls                         # List platforms and plugins

# Android Commands
adb devices                        # List connected devices
adb reverse tcp:4200 tcp:4200     # Set up port forwarding
adb shell am start -n PACKAGE/ACTIVITY  # Start app manually
adb logcat                         # View device logs

# Build Commands
nx build time-tracker              # Build Angular app
nx build time-tracker --watch      # Build with watch mode
nx serve time-tracker --host 0.0.0.0  # Serve with external access
```

---

## Success Story: What We Accomplished

This documentation captures the successful setup and deployment of the Time Tracker Angular application to Android. Key achievements:

✅ **Resolved Java 17 compatibility** issues with Capacitor  
✅ **Established reliable build process** using standalone mode  
✅ **Configured VS Code** for mobile development  
✅ **Successfully deployed** a fully functional Android app  
✅ **Created reproducible workflow** for future development  

The final result: A beautiful, responsive time-tracking application running natively on Android with a professional mobile interface, complete touch optimization, and full functionality.

**Date Completed**: August 14, 2025  
**Development Environment**: Windows 11, VS Code, Android Studio  
**Target Platform**: Android (Pixel 9 Pro Emulator)  
**Technologies**: Angular 18, Capacitor, NestJS, MongoDB
