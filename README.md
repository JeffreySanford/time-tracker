# TimeTracker

Last updated: 2025-08-15

A comprehensive time tracking application built with Angular, NestJS, and Capacitor for cross-platform development.

## 🚀 Quick Start

### Web Development

```bash
# Start frontend and backend for web development
npm run start:all

# Start with development environment (in-memory MongoDB)
npm run start:all:dev
```

### Android Development

```bash
# Start full Android development stack (frontend + backend + Android app)
npm run start:all:android:dev
```

## 📱 Android Development Setup

### Prerequisites

- **Android Studio** installed with Android SDK
- **Java/JDK** (bundled with Android Studio)
- **Android Emulator** or physical device

### Android Development Features

- ✅ **Live Reload**: Changes automatically reflect in the Android app
- ✅ **In-Memory Database**: Uses MongoMemoryServer for development
- ✅ **Pixel 9 Pro Target**: Automatically targets Pixel 9 Pro emulator
- ✅ **Network Configuration**: Properly configured for emulator access
- ✅ **Color-coded Logging**: Easy to distinguish between services

## 📋 Available Scripts

### 🌐 Web Development

| Command | Description |
|---------|-------------|
| `npm run start:frontend` | Frontend only (Angular dev server) |
| `npm run start:backend` | Backend only (NestJS API with persistent MongoDB) |
| `npm run start:backend:dev` | Backend with in-memory MongoDB |
| `npm run start:all` | Frontend + Backend (persistent DB) |
| `npm run start:all:dev` | Frontend + Backend (in-memory DB) |

### 📱 Android Development

| Command | Description |
|---------|-------------|
| `npm run start:frontend:android` | Frontend with network access for Android |
| `npm run start:all:android:dev` | **Full Android stack** (recommended) |
| `npm run android:dev` | Android app only (requires servers running) |
| `npm run android:build` | Build and open in Android Studio |
| `npm run android:sync` | Sync web assets to Android |
| `npm run android:open` | Open project in Android Studio |

### 🔧 Build & Utilities

| Command | Description |
|---------|-------------|
| `npm run build:android` | Build web app and sync to Android |
| `npm run cap:sync` | Sync all Capacitor platforms |
| `npm run cap:copy` | Copy web assets to native platforms |

## 🏗️ Architecture

### Frontend (Angular)

- **Location**: `apps/time-tracker/`
- **Port**: `4200` (web), `0.0.0.0:4200` (Android development)
- **Features**: Material Design UI, time tracking, project management

### Backend (NestJS)

- **Location**: `apps/api/`
- **Port**: `3000`
- **Database**: MongoDB (persistent) or MongoMemoryServer (development)
- **Features**: REST API, time tracking endpoints, health checks

### Mobile (Capacitor)

- **Platform**: Android (iOS support available)
- **Target**: Pixel 9 Pro emulator
- **Configuration**: `capacitor.config.ts`

## 🔧 Development Workflow

### 1. Web Development

```bash
# Start development servers
npm run start:all:dev

# Navigate to http://localhost:4200
# API available at http://localhost:3000/api
```

### 2. Android Development

```bash
# Start full Android development stack
npm run start:all:android:dev
```

This command will:

1. **Start Frontend** with network access (`0.0.0.0:4200`)
2. **Start Backend** with in-memory MongoDB
3. **Wait 8 seconds** for servers to initialize
4. **Launch Android App** targeting Pixel 9 Pro with live reload

### 3. Making Changes

- **Frontend changes**: Automatically reload in both web and Android
- **Backend changes**: Restart the backend service
- **Native changes**: Run `npm run android:sync` to update

## 🌍 Network Configuration

### Web Development URLs

- **Frontend**: `http://localhost:4200`
- **Backend**: `http://localhost:3000`

### Android Development URLs

- **Frontend (from emulator)**: `http://10.0.2.2:4200`
- **Backend (from emulator)**: `http://10.0.2.2:3000`
- **Host Network**: `http://192.168.1.194:4200` (your local IP)

## 🗃️ Database Configuration

### Development Mode (`NODE_ENV=development`)

- Uses **MongoMemoryServer** (in-memory database)
- Perfect for testing and development
- No external MongoDB installation required

### Production Mode

- Uses persistent MongoDB at `mongodb://localhost:27017/time-tracker`
- Requires MongoDB installation

## 🐛 Troubleshooting

### Android Issues

1. **"Webpage not available"**: Ensure frontend is running on `0.0.0.0:4200`
2. **ADB errors**: Check Android SDK path and emulator status
3. **Java errors**: Verify Android Studio JDK installation

### Network Issues

1. **Can't connect from emulator**: Use `10.0.2.2` instead of `localhost`
2. **CORS errors**: Backend is configured for `localhost:4200` access

### Build Issues

1. **Port conflicts**: Stop existing processes on ports 3000/4200
2. **Environment variables**: Ensure `NODE_ENV` is set correctly

## 📚 Tech Stack

- **Frontend**: Angular 20, Material Design, TypeScript
- **Backend**: NestJS, MongoDB/Mongoose, TypeScript  
- **Mobile**: Capacitor 7, Android SDK
- **Build**: Nx Workspace, Vite, concurrently
- **Database**: MongoDB (production), MongoMemoryServer (development)

## 🔗 Useful Links

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Angular Documentation](https://angular.io/docs)
