# iOS Development Guide

This document outlines how to extend the Time Tracker application to iOS and distribution options for internal deployment.

## Current Architecture Overview

### Frontend

- **Framework**: Angular 20.1+ with Angular Material
- **Build Tool**: Nx monorepo with Vite
- **Mobile Framework**: Capacitor 7.4.2
- **State Management**: NgRx with Effects

### Backend

- **Framework**: NestJS 11.1+
- **Database**: MongoDB with Mongoose ODM
- **API Endpoints**: RESTful APIs for time tracking

### Data Storage Status

- ✅ **Time Sessions**: Fully persisted in MongoDB via `/api/timeworked/*` endpoints
- ❌ **Tasks**: Currently in-memory only (resets on app refresh)
- 🔄 **Projects**: Static data defined in frontend components

## iOS Development Setup

### Prerequisites

#### ⚠️ IMPORTANT: iOS development requires macOS

#### For macOS Users

- Mac with Xcode installed
- Apple Developer Account (see distribution options below)
- Node.js environment already configured

#### For Windows Users

iOS development is **not possible directly on Windows**. You need:

- **Cloud Mac service** (MacStadium, etc.) - ~$99-199/month
- **Mac Mini** purchase (~$599 new, ~$400 refurbished)
- **GitHub Actions** for automated builds only
- **Team member with Mac** for iOS builds

### Current iOS Support Status

✅ **Already Configured:**

- `@capacitor/ios` dependency installed
- iOS project structure exists in `/ios` directory
- Capacitor configuration supports iOS
- iOS-specific npm scripts added

### Quick Start Commands

```bash
# Build frontend for iOS
npm run build:frontend

# Sync with iOS platform
npm run ios:sync

# Build and open in Xcode
npm run ios:build

# Open existing iOS project in Xcode
npm run ios:open
```

### Available npm Scripts

```json
{
  "ios:build": "nx run time-forge:build && npx cap sync ios && npx cap open ios",
  "ios:sync": "npx cap sync ios",
  "ios:open": "npx cap open ios"
}
```

## Distribution Options (No App Store Required)

### Option 1: Apple Developer Enterprise Program ⭐ **Recommended for Internal Apps**

- **Cost**: $299/year
- **Device Limit**: Unlimited
- **User Limit**: Unlimited within organization
- **Requirements**:
  - Must be a legal entity (corporation, LLC, etc.)
  - DUNS number required
  - Apps cannot be distributed publicly
- **Best For**: Large internal deployments, enterprise customers

### Option 2: TestFlight Distribution

- **Cost**: $99/year (Standard Apple Developer Program)
- **Device Limit**: 10,000 external testers
- **Duration**: 90-day app expiration (renewable)
- **Requirements**: Apple Developer Program membership
- **Best For**: Beta testing, medium-sized internal teams

### Option 3: Ad Hoc Distribution

- **Cost**: $99/year (Standard Apple Developer Program)
- **Device Limit**: 100 devices per year
- **Requirements**: Device UUIDs must be registered
- **Best For**: Small internal teams, specific device deployments

### Option 4: Development Provisioning

- **Cost**: Free (7-day) or $99/year (1-year certificates)
- **Device Limit**: Limited to registered development devices
- **Requirements**: Xcode and Apple Developer account
- **Best For**: Development and testing only

## iOS Development Workflow

### 1. Initial Setup

```bash
# Ensure iOS platform is synced
npm run ios:sync

# Open in Xcode for first-time setup
npm run ios:open
```

### 2. Development Cycle

```bash
# Make changes to Angular app
# Build and test
npm run build:frontend
npm run ios:sync

# Open in Xcode for device testing
npm run ios:open
```

### 3. Distribution Preparation

```bash
# Production build
npm run build:frontend

# Sync to iOS
npm run ios:sync

# Archive in Xcode for distribution
npm run ios:open
```

## Capacitor Configuration

Current configuration in `capacitor.config.ts`:

```typescript
{
  appId: 'com.truenorth.timetracker',
  appName: 'Time Tracker',
  webDir: 'dist/apps/time-tracker/browser',
  ios: {
    scheme: 'Time Tracker',
    contentInset: 'automatic'
  }
}
```

## iOS-Specific Considerations

### Server Configuration

- **Development**: Uses localhost with specific host configuration
- **Production**: Will need to point to deployed backend URL
- **CORS**: Ensure backend allows requests from iOS app

### Permissions

The app may require iOS permissions for:

- Background processing (for timer functionality)
- Local notifications (for time tracking alerts)

### Native Features

Capacitor provides access to:

- Device storage (for offline functionality)
- Push notifications
- Background tasks
- Camera/photo access (if needed for future features)

## Data Persistence Roadmap

### Current Status

- **Time Tracking Sessions**: ✅ Persisted via NestJS API
- **User Tasks**: ❌ In-memory only (sample data)
- **Projects**: ❌ Static frontend data

### Recommended Implementation

1. **Task Persistence**: Create MongoDB schema and API endpoints
2. **Project Management**: Move to database with user association
3. **Offline Support**: Implement local storage with sync capabilities

### Task API Schema (Proposed)

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  tags: string[];
  status: 'active' | 'completed' | 'paused';
  timeSpent: number;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Considerations

### For Enterprise Distribution

- Code signing certificates required
- Enterprise certificates have stricter validation
- Apps can be revoked remotely by Apple

### For Internal Distribution

- Device management may be required
- Consider mobile device management (MDM) integration
- User authentication and authorization

## Troubleshooting

### Common iOS Build Issues

1. **Xcode Version**: Ensure latest Xcode version
2. **iOS Target**: Verify minimum iOS version compatibility
3. **Certificates**: Check signing certificate validity
4. **Provisioning Profiles**: Ensure correct profile selection

### Performance Optimization

- Bundle size optimization for mobile
- Image compression and lazy loading
- Service worker for offline functionality

## Next Steps

1. **Set up Apple Developer Account** based on chosen distribution strategy
2. **Configure iOS signing** in Xcode
3. **Implement task persistence** to complete data architecture
4. **Test on physical iOS devices**
5. **Set up CI/CD pipeline** for automated iOS builds

## Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Enterprise Program](https://developer.apple.com/programs/enterprise/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [Nx Angular Documentation](https://nx.dev/nx-api/angular)

---

**Last Updated**: August 18, 2025  
**iOS Support Status**: Ready for development  
**Distribution Recommendation**: Enterprise Program for internal deployment
