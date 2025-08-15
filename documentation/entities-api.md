# Current Entities (Implemented)

Last updated: 2025-08-15

## TimeWorked Schema

```typescript
interface TimeWorked {
  _id: ObjectId;          // MongoDB generated unique identifier
  userId: string;         // User identifier (currently "demo-user")
  duration: number;       // Calculated duration in seconds
  startedAt: Date;        // Session start timestamp
  endedAt?: Date | null;  // Session end timestamp (nullable for active sessions)
  __v: number;           // MongoDB version key
}
```

## Current API Endpoints (Implemented)

### Timer Management

- `POST /api/timeworked/start` → Start new timer session

  ```json
  Request: { "userId": "demo-user" }
  Response: {
    "_id": "689b9e616e24be8fa873b16f",
    "userId": "demo-user",
    "startedAt": "2025-08-12T20:04:49.717Z",
    "endedAt": null,
    "duration": 0,
    "__v": 0
  }
  ```

- `PATCH /api/timeworked/stop/:id` → Stop active timer session

  ```json
  Request: { "endedAt": "2025-08-12T20:04:52.527Z" }
  Response: {
    "_id": "689b9e616e24be8fa873b16f",
    "userId": "demo-user",
    "startedAt": "2025-08-12T20:04:49.717Z",
    "endedAt": "2025-08-12T20:04:52.527Z",
    "duration": 2,
    "__v": 0
  }
  ```

- `GET /api/timeworked` → Get all time sessions
- `GET /api/health` → Health check endpoint

# Future Entities (Planned)

- **User**: id, name, email, roles[], orgId
- **Project**: id, name, clientId, repoUrl?, defaultBranch?, tags[]
- **Session**: id, userId, projectId, start, end, source, type, tags[]
- **Heartbeat**: id, userId, projectId?, ts, durationSec, editor, language, fileHash, branch?, isWrite, deviceId, source
- **Device**: id, userId, name, platform, lastSeen
- **ApiKey**: id, userId, label, scopes[], createdAt

# Future API Endpoints (Planned)

- `POST /v1/heartbeats:batch` → [HeartbeatDTO] (max 100 per request)
- `POST /v1/sessions` → create manual/pomodoro session
- `PATCH /v1/sessions/:id` → stop/update
- `GET /v1/summary?range=today|week|custom`
- `GET /v1/projects/:id/summary?range=week`
- `POST /v1/apikeys` / `DELETE /v1/apikeys/:id`
- `WS /v1/live` → push {todayMinutes, byLanguage[], byEditor[]} deltas

---

# Android Implementation Notes

- Stack: Kotlin + Jetpack Compose UI; RxJava3 or Kotlin Flow
- Data: Room for local cache; WorkManager for offline → batch sync
- Live: OkHttp WebSocket + Rx bridge for real-time summaries
- Idle/Pomodoro: Foreground service + notifications; configurable thresholds
- Testing: Unit tests for bucketing/aggregation; UI tests for timer/idle
