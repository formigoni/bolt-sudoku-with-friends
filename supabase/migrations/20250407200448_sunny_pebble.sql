/*
  # Add candidates column to games table

  1. Changes
    - Add `candidates` column to `games` table to store candidate numbers
      - Stores cell candidates as JSONB where keys are cell coordinates and values are arrays of numbers
      - Uses JSONB type for flexible schema and efficient querying
      - Default empty object prevents null values

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE games
ADD COLUMN IF NOT EXISTS candidates JSONB DEFAULT '{}'::jsonb;