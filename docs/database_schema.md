# 🗄️ D1 Database Schema Documentation

Planning Poker uses a structured **SQLite database** bound to a Cloudflare D1 environment. The tables are optimized to track active rooms, participants, estimates, and historical logs.

---

## 1. Table: `sessions`
Stores session rooms and round parameters.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique 6-character room identifier (e.g. `BYPVAU`). |
| `name` | `TEXT` | `NOT NULL` | The session room title set by the host. |
| `card_type` | `TEXT` | `NOT NULL` | The estimation deck style: `fibonacci`, `tshirt`, or `custom`. |
| `current_story` | `TEXT` | `DEFAULT 'First Story'` | Stores the active estimation topic and optional timer parameters. |
| `revealed` | `INTEGER` | `DEFAULT 0` | Boolean state: `0` (cards hidden/face down), `1` (cards flipped face-up). |
| `created_at` | `INTEGER` | `NOT NULL` | Epoch millisecond timestamp of room creation. |

### Schema-Less Timer Synchronization
To prevent unnecessary D1 schema updates and keep transactions simple, any active session timer is appended directly to the `current_story` string using a pipe separator:
```text
Story Title|1777263592000
```
The suffix represents the epoch millisecond at which the round timer expires. Frontend clients automatically split this string:
*   Left part: Displays as the visible story header (`Story Title`).
*   Right part: Parsed as a future epoch timestamp to calculate and animate real-time countdows locally.

---

## 2. Table: `participants`
Tracks connected electors, hosts, observers, and heartbeats.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique participant key (e.g. `part_x8yd21`). |
| `session_id` | `TEXT` | `NOT NULL`, `REFERENCES sessions(id)` | Room bound to this participant. |
| `display_name` | `TEXT` | `NOT NULL` | Nickname selected by user. |
| `role` | `TEXT` | `NOT NULL` | Participation style: `voter` or `spectator`. |
| `vote` | `TEXT` | `DEFAULT NULL` | Active estimate value cast (e.g. `5`, `XL`, or `?`). |
| `joined_at` | `INTEGER` | `NOT NULL` | Epoch millisecond timestamp of room entry. |
| `last_seen` | `INTEGER` | `NOT NULL` | Heartbeat timestamp. Updated on every poll. |

### Heartbeats & Active Sweeps
Every `GET /api/session/[id]` poll updates the participant's `last_seen` timestamp. If a participant's `last_seen` timestamp falls behind by more than **90 seconds** (e.g. due to inactive browser tabs or closing the window), the polling engine deletes their database row automatically, triggering hosting right re-calculations (oldest active participant becomes host).

---

## 3. Table: `stories_history`
Houses archived estimation round logs.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Auto-incrementing log record row. |
| `session_id` | `TEXT` | `NOT NULL`, `REFERENCES sessions(id)` | Room bound to this log. |
| `story_name` | `TEXT` | `NOT NULL` | The estimated story title. |
| `final_estimate` | `TEXT` | `NOT NULL` | The final Scrum score decided and saved by the host. |
| `votes_json` | `TEXT` | `NOT NULL` | JSON stringified list of votes cast by participants during that round. |
| `created_at` | `INTEGER` | `NOT NULL` | Epoch millisecond timestamp of log save. |

---

## ⚡ Index Optimization Schema
To ensure edge query operations remain extremely fast, database indexes are applied on session columns:

```sql
-- Fast participant sweeps & seat queries
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);

-- Rapid history stream lookups
CREATE INDEX IF NOT EXISTS idx_history_session ON stories_history(session_id);
```
