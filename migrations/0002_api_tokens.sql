-- Create API tokens table for MCP authentication
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create indexes for efficient lookups
-- UNIQUE constraint on token_hash prevents collision attacks (SEC-001)
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
