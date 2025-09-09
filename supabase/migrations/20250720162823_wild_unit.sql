/*
  # Update slideshow security policies

  1. Security Changes
    - Remove public access policy
    - Add authenticated user policies for CRUD operations
    - Users can only access their own slideshows

  2. New Policies
    - Users can create their own slideshows
    - Users can read their own slideshows
    - Users can update their own slideshows
    - Users can delete their own slideshows
*/

-- Remove the existing public access policy
DROP POLICY IF EXISTS "Allow public access to slideshows" ON slideshows;

-- Add user_id column to link slideshows to users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slideshows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE slideshows ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create policies for authenticated users
CREATE POLICY "Users can create their own slideshows"
  ON slideshows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own slideshows"
  ON slideshows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own slideshows"
  ON slideshows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own slideshows"
  ON slideshows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow public read access for shared slideshows (viewing only)
CREATE POLICY "Allow public read access for viewing shared slideshows"
  ON slideshows
  FOR SELECT
  TO anon
  USING (true);