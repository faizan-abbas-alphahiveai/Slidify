/*
  # Create feedback headings table

  1. New Tables
    - `feedback_headings`
      - `id` (uuid, primary key)
      - `heading` (text, the heading text)
      - `is_active` (boolean, whether the heading is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to users, nullable for system headings)

  2. Security
    - Enable RLS on `feedback_headings` table
    - Add policy for public read access to active headings
    - Add policy for authenticated users to manage their own headings

  3. Initial Data
    - Insert the provided feedback headings
*/

CREATE TABLE IF NOT EXISTS feedback_headings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE feedback_headings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active feedback headings"
  ON feedback_headings
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can create feedback headings"
  ON feedback_headings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own feedback headings"
  ON feedback_headings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback headings"
  ON feedback_headings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback headings"
  ON feedback_headings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_feedback_headings_updated_at
  BEFORE UPDATE ON feedback_headings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert the provided feedback headings as system headings (user_id = null)
INSERT INTO feedback_headings (heading, user_id) VALUES
  ('Hey, got a sec? We''d love your hot take on Slidify.', null),
  ('Tell us what''s working, what''s weird, and what''s "whoa."', null),
  ('We''re not mind readers (yet). Tell us what''s on yours.', null),
  ('Like what you see? Hate what you don''t? Let''s talk.', null),
  ('Be honest. We can handle it (probably).', null),
  ('This feedback form is 100% gluten-free.', null),
  ('Help us level up — no boss fight required.', null),
  ('Got opinions? We''re collecting them like Pokémon.', null),
  ('Tell us what''s awesome and what''s "hmm."', null),
  ('Your feedback fuels our app. Also coffee, but mostly feedback.', null);