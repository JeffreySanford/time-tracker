# TimeTracker - Quick Reference

Last updated: 2025-08-15

## � Recent Changes

- **August 15, 2025**: Removed component variants approach in favor of a single responsive component with CSS media queries.

## �🚀 Essential Commands

### Start Android Development (Most Common)

```bash
npm run start:all:android:dev
```

**What it does:**

- Starts frontend with network access for Android
- Starts backend with in-memory MongoDB  
- Launches Android app on Pixel 9 Pro with live reload

### Start Web Development

```bash
npm run start:all:dev
```

**What it does:**

- Starts frontend on localhost:4200
- Starts backend with in-memory MongoDB

## 📱 URLs & Ports

| Service | Web Access | Android Access |
|---------|------------|----------------|
| Frontend | `http://localhost:4200` | `http://10.0.2.2:4200` |
| Backend API | `http://localhost:3000` | `http://10.0.2.2:3000` |
| Health Check | `http://localhost:3000/api/health` | `http://10.0.2.2:3000/api/health` |

## 🔧 Troubleshooting Quick Fixes

### "Webpage not available" in Android

```bash
# Check if frontend is accessible to Android
netstat -ano | grep :4200
# Should show 0.0.0.0:4200, not 127.0.0.1:4200
```

### Port conflicts

```bash
# Kill processes on ports 4200 and 3000
taskkill /f /im node.exe /fi "WINDOWTITLE eq *4200*"
taskkill /f /im node.exe /fi "WINDOWTITLE eq *3000*"
```

### Android device not found

```bash
# Check connected devices
adb devices
# Should list your emulator or device
```

## 🎯 Development Workflow

1. **Start development**: `npm run start:all:android:dev`
2. **Wait for all services**: Look for green checkmarks in terminal
3. **Make changes**: Files auto-reload in Android app
4. **Test features**: App connects to local API server

## 📋 Success Indicators

Look for these messages in the terminal:

- `[frontend] ➜ Network: http://192.168.1.x:4200/`
- `[backend] [MongoMemoryServer] Started in-memory MongoDB`
- `[android] √ Running Gradle build`
- `[android] √ Deploying app-debug.apk to Pixel_9_Pro`

## 💾 Database Modes

| Mode | Command | Database Type |
|------|---------|---------------|
| Development | `npm run start:all:android:dev` | In-memory (fresh each start) |
| Production | `npm run start:all` | Persistent MongoDB |

## 🔍 Quick Health Checks

```bash
# Test frontend
curl http://localhost:4200

# Test backend
curl http://localhost:3000/api/health

# Test from Android perspective  
curl http://10.0.2.2:4200
curl http://10.0.2.2:3000/api/health
```
