/*
  # Create user feedback table

  1. New Tables
    - `user_feedback`
      - `id` (uuid, primary key)
      - `star_rating` (integer, 1-5 rating)
      - `loved_feature` (text, what user loved about the app)
      - `improvement` (text, suggested improvements)
      - `first_name` (text, optional contact info)
      - `email` (text, optional contact info)
      - `user_id` (uuid, foreign key to auth.users, nullable for anonymous feedback)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_feedback` table
    - Add policy for anyone to submit feedback (including anonymous users)
    - Add policy for authenticated users to read their own feedback
*/

CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  star_rating integer NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  loved_feature text DEFAULT '',
  improvement text DEFAULT '',
  first_name text DEFAULT '',
  email text DEFAULT '',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to submit feedback
CREATE POLICY "Anyone can submit feedback"
  ON user_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read their own feedback
CREATE POLICY "Users can read their own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();