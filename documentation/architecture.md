# System Architecture (Mermaid)

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

# Client Flow (Mermaid Sequence Diagram)

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
