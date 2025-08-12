# Core Entities

- **User**: id, name, email, roles[], orgId
- **Project**: id, name, clientId, repoUrl?, defaultBranch?, tags[]
- **Session**: id, userId, projectId, start, end, source, type, tags[]
- **Heartbeat**: id, userId, projectId?, ts, durationSec, editor, language, fileHash, branch?, isWrite, deviceId, source
- **Device**: id, userId, name, platform, lastSeen
- **ApiKey**: id, userId, label, scopes[], createdAt

---

# API Endpoints (Sample)

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
