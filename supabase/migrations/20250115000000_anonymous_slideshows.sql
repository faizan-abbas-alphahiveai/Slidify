/*
  # Enable anonymous slideshow creation and transfer

  1. Security Changes
    - Allow anonymous users to create slideshows (user_id = null)
    - Allow anonymous users to update slideshows they created
    - Allow authenticated users to update slideshows with user_id = null (for transfer)

  2. New Policies
    - Anonymous users can create slideshows with user_id = null
    - Anonymous users can update slideshows with user_id = null
    - Authenticated users can update slideshows with user_id = null (for transfer)
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous users to create slideshows" ON slideshows;
DROP POLICY IF EXISTS "Allow anonymous users to update their slideshows" ON slideshows;
DROP POLICY IF EXISTS "Allow authenticated users to read anonymous slideshows" ON slideshows;
DROP POLICY IF EXISTS "Allow authenticated users to transfer anonymous slideshows" ON slideshows;
DROP POLICY IF EXISTS "Allow anonymous users to delete their slideshows" ON slideshows;

-- Allow anonymous users to create slideshows
CREATE POLICY "Allow anonymous users to create slideshows"
  ON slideshows
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Allow anonymous users to update slideshows they created
CREATE POLICY "Allow anonymous users to update their slideshows"
  ON slideshows
  FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- Allow authenticated users to read slideshows with user_id = null (for transfer)
CREATE POLICY "Allow authenticated users to read anonymous slideshows"
  ON slideshows
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL);

-- Allow authenticated users to update slideshows with user_id = null (for transfer)
CREATE POLICY "Allow authenticated users to transfer anonymous slideshows"
  ON slideshows
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to delete slideshows they created
CREATE POLICY "Allow anonymous users to delete their slideshows"
  ON slideshows
  FOR DELETE
  TO anon
  USING (user_id IS NULL);
