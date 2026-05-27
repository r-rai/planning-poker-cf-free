-- D1 Schema for Planning Poker Scrum

-- Table to track active gaming sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  card_type TEXT NOT NULL, -- 'fibonacci' | 'tshirt' | 'custom'
  current_story TEXT,
  revealed INTEGER DEFAULT 0, -- 0 = hidden, 1 = revealed
  created_at INTEGER NOT NULL
);

-- Table to track session participants
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'voter' | 'spectator'
  vote TEXT, -- Nullable, tracks selected card estimate
  joined_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL, -- Timestamp of last GET heartbeat
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Table to track previous estimations in a session
CREATE TABLE IF NOT EXISTS stories_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  story_name TEXT NOT NULL,
  final_estimate TEXT,
  votes_json TEXT NOT NULL, -- JSON formatted array of participant names and votes
  created_at INTEGER NOT NULL,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_last_seen ON participants(last_seen);
CREATE INDEX IF NOT EXISTS idx_history_session ON stories_history(session_id);
