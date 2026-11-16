-- Create the settings table for persisting Supabase config across devices
CREATE TABLE IF NOT EXISTS omnistudio_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER))
);