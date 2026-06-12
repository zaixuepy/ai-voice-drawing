CREATE TABLE IF NOT EXISTS command_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_input TEXT,
  canvas_state TEXT,
  ai_output TEXT,
  latency_ms INTEGER,
  token_count INTEGER,
  is_clarify INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feedback_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  command_log_id INTEGER REFERENCES command_logs(id),
  feedback_type TEXT,
  user_input TEXT,
  ai_output TEXT
);
