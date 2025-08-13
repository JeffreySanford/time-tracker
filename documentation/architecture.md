# System Architecture (Current Implementation)

## Current State (Phase 1)
```mermaid
flowchart LR
  UI[Angular Frontend\n(Timer UI)] -->|HTTP REST| API[NestJS API\n(Express + Mongoose)]
  API --> DB[(MongoDB\nTimeWorked Collection)]
  UI -->|Start/Stop Timer| API
  API -->|Session Data| DB
  API -->|Health Check| UI
  
  subgraph "Frontend Features"
    UI --> TIMER[Timer Display]
    UI --> BUTTONS[Start/Stop Buttons]
    UI --> STATUS[Connection Status]
  end
  
  subgraph "Backend Services"
    API --> HEALTH[Health Controller]
    API --> TIMEWORK[TimeWorked Controller]
    API --> SERVICE[TimeWorked Service]
  end
```

## Future Architecture (Target State)
```mermaid
flowchart LR
  A[IDE Plugins\n(VS Code, JetBrains, Android Studio)] -->|heartbeat| G[/HTTP POST /heartbeats/]
  M[Android App\n(Rx + WebSocket)] -->|start/stop, manual, settings| G
  G[NestJS API Gateway\n(JWT+API Keys, RBAC)] --> I[(Ingest Service)]
  I --> Q[(Queue/Buffer\n(e.g., Redis Stream))]
  Q --> AGG[Aggregator\n(rollups: 5m/1h/d)]
  Q --> RAW[(Postgres/Timescale\nheartbeats, sessions)]
  AGG --> RPT[(Materialized views\nsummaries)]
  G <-->|WS: real-time summaries| M
  G --> ADM[Admin UI\n(optional web)]
```

---

# Client Flow (Current Implementation)

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Angular UI
  participant API as NestJS API
  participant DB as MongoDB

  U->>UI: Click Start Timer
  UI->>API: POST /api/timeworked/start
  API->>DB: Create new session document
  DB-->>API: Return session with _id
  API-->>UI: Session data with sessionId
  UI->>UI: Start local timer display
  
  Note over UI: Timer runs locally, updates display every second
  
  U->>UI: Click Stop Timer
  UI->>API: PATCH /api/timeworked/stop/:sessionId
  API->>DB: Update session with endedAt
  API->>API: Calculate duration in seconds
  API->>DB: Save updated session
  DB-->>API: Confirm update
  API-->>UI: Updated session with duration
  UI->>UI: Stop local timer, reset display
```

# Future Client Flow (Target State)

```mermaid
sequenceDiagram
  participant U as User
  participant A as Android App
  participant S as NestJS API
  participant AG as Aggregator

  U->>A: Sign in (JWT) / Generate API Key
  A->>S: Register device + fetch today's summary
  Note over A,S: WebSocket opens for live stats
  IDE->>S: POST /heartbeats (apiKey)
  S->>AG: enqueue for rollup
  AG->>S: update materialized summaries
  S-->>A: push updated Today/Week totals (WS)
  U->>A: Start/Stop Timer, manual entries
  A->>S: POST /sessions /entries
  S-->>A: Confirm + live update
```
