/*
  # Fix music table INSERT policy

  1. Policy Updates
    - Drop existing INSERT policy for music table
    - Create new INSERT policy that allows authenticated users to insert their own music
    - Policy ensures user_id matches auth.uid() and access is 'private' for uploads

  2. Security
    - Maintains RLS protection
    - Only allows users to insert music records they own
    - Restricts uploads to private access level for user uploads
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own music" ON music;

-- Create new INSERT policy with proper conditions
CREATE POLICY "Allow authenticated users to insert their own private music"
  ON music
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND access = 'private');