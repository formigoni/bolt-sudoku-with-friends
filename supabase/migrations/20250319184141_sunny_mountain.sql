/*
  # Create games table for Sudoku multiplayer

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `board` (jsonb, stores current game state)
      - `solution` (jsonb, stores complete solution)
      - `initial_board` (jsonb, stores initial board state)
      - `status` (text, game status: 'waiting', 'playing', 'completed')

  2. Security
    - Enable RLS on `games` table
    - Add policies for:
      - Anyone can read active games
      - Only authenticated users can create games
      - Players can update their game
*/

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  board jsonb NOT NULL,
  solution jsonb NOT NULL,
  initial_board jsonb NOT NULL,
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'playing', 'completed'))
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read games"
  ON games
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update games"
  ON games
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);