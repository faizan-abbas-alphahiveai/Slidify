/*
  # Create taglines table

  1. New Tables
    - `taglines`
      - `id` (uuid, primary key)
      - `text` (text, the tagline content)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `taglines` table
    - Add policy for public read access to active taglines
    - Add policies for authenticated users to manage their own taglines

  3. Sample Data
    - Insert some default taglines to get started
*/

CREATE TABLE IF NOT EXISTS taglines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE taglines ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active taglines
CREATE POLICY "Allow public read access to active taglines"
  ON taglines
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Allow authenticated users to create taglines
CREATE POLICY "Users can create taglines"
  ON taglines
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own taglines (including inactive ones)
CREATE POLICY "Users can read their own taglines"
  ON taglines
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own taglines
CREATE POLICY "Users can update their own taglines"
  ON taglines
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own taglines
CREATE POLICY "Users can delete their own taglines"
  ON taglines
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_taglines_updated_at
  BEFORE UPDATE ON taglines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default taglines
INSERT INTO taglines (text, is_active, user_id) VALUES
  ('Create beautiful slideshows with a few simple clicks', true, NULL),
  ('Turn your memories into stunning visual stories', true, NULL),
  ('Share your moments in style', true, NULL),
  ('Simple. Elegant. Shareable.', true, NULL),
  ('Transform photos into captivating presentations', true, NULL),
  ('Your stories deserve beautiful presentation', true, NULL),
  ('Create, customize, and share with ease', true, NULL),
  ('Making slideshow creation effortless', true, NULL);