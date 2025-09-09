/*
  # Create music table

  1. New Tables
    - `music`
      - `id` (uuid, primary key)
      - `audio_url` (text, not null) - URL to the audio file
      - `song_title` (text, not null) - Title of the song
      - `access` (text, not null, default 'private') - Access level: 'public' or 'private'
      - `duration` (integer, not null) - Duration in seconds
      - `user_id` (uuid, foreign key) - References auth.users(id)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `music` table
    - Add policy for public read access to public music
    - Add policy for users to read their own music
    - Add policy for users to create their own music
    - Add policy for users to update their own music
    - Add policy for users to delete their own music

  3. Triggers
    - Add trigger to automatically update `updated_at` column
*/

CREATE TABLE IF NOT EXISTS music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_url text NOT NULL,
  song_title text NOT NULL,
  access text NOT NULL DEFAULT 'private' CHECK (access IN ('public', 'private')),
  duration integer NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE music ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to public music
CREATE POLICY "Allow public read access to public music"
  ON music
  FOR SELECT
  TO anon, authenticated
  USING (access = 'public');

-- Policy for users to read their own music
CREATE POLICY "Users can read their own music"
  ON music
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to create their own music
CREATE POLICY "Users can create their own music"
  ON music
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own music
CREATE POLICY "Users can update their own music"
  ON music
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own music
CREATE POLICY "Users can delete their own music"
  ON music
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at column
CREATE TRIGGER update_music_updated_at
  BEFORE UPDATE ON music
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();