@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%

echo Setting up Android development environment...
echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo
echo Checking ADB connection...
adb devices
echo
echo Starting Capacitor Android with live reload...
echo Note: Using 10.0.2.2:4200 for emulator access to host localhost:4200
echo

npx cap run android --live-reload --host=10.0.2.2 --port=4200
