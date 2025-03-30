/*
  # Add players column to games table

  1. Changes
    - Add `players` column to `games` table to store player information
      - Stores array of players with their id, nickname, color, and cursor position
      - Uses JSONB type for flexible schema

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE games
ADD COLUMN IF NOT EXISTS players JSONB DEFAULT '[]'::jsonb;