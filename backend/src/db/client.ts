import { Database } from 'bun:sqlite'

const DB_PATH = process.env.DB_PATH ?? 'data.db'
console.log(`[db] Using database at: ${DB_PATH}`)

let db: Database
try {
  db = new Database(DB_PATH, { create: true })
  db.exec(`
    CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      geometry_type TEXT NOT NULL DEFAULT 'Point',
      coordinates TEXT NOT NULL,
      properties TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      method TEXT,
      path TEXT,
      query_params TEXT,
      body TEXT,
      status_code INTEGER,
      success INTEGER,
      response_time_ms INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      environment TEXT,
      request_started_at TEXT,
      request_completed_at TEXT
    );
  `)
} catch (err) {
  console.error(`[db] Failed to open or initialise database at "${DB_PATH}":`, err)
  process.exit(1)
}

export { db }
