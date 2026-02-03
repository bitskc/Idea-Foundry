-- Rollback migration for api_tokens table
-- Run this to undo 0002_api_tokens.sql

DROP INDEX IF EXISTS idx_api_tokens_user;
DROP INDEX IF EXISTS idx_api_tokens_hash;
DROP TABLE IF EXISTS api_tokens;
