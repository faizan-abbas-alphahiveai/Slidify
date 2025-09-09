/*
  # Create slideshow_name_msg table

  1. New Tables
    - `slideshow_name_msg`
      - `id` (uuid, primary key)
      - `slideshow_name` (text, the slideshow name)
      - `slideshow_message` (text, the slideshow message)
      - `is_active` (boolean, whether the entry is active, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users, nullable for system entries)

  2. Security
    - Enable RLS on `slideshow_name_msg` table
    - Add policy for public read access to active entries
    - Add policies for authenticated users to manage their own entries

  3. Triggers
    - Add trigger to automatically update `updated_at` column
*/

CREATE TABLE IF NOT EXISTS slideshow_name_msg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slideshow_name text NOT NULL,
  slideshow_message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE slideshow_name_msg ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active entries
CREATE POLICY "Allow public read access to active slideshow name messages"
  ON slideshow_name_msg
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Allow authenticated users to create their own entries
CREATE POLICY "Users can create slideshow name messages"
  ON slideshow_name_msg
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own entries (including inactive ones)
CREATE POLICY "Users can read their own slideshow name messages"
  ON slideshow_name_msg
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own entries
CREATE POLICY "Users can update their own slideshow name messages"
  ON slideshow_name_msg
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own entries
CREATE POLICY "Users can delete their own slideshow name messages"
  ON slideshow_name_msg
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_slideshow_name_msg_updated_at
  BEFORE UPDATE ON slideshow_name_msg
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();