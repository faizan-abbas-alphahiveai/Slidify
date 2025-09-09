/*
  # Fix music table INSERT RLS policy

  1. Security Policy Updates
    - Drop existing INSERT policy for music table
    - Create new INSERT policy that properly allows authenticated users to insert their own music
    - Ensure the policy correctly validates user_id matches auth.uid()

  2. Changes
    - Replace existing "Authenticated users can insert their own music" policy
    - Use proper RLS syntax for INSERT operations
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert their own music" ON music;

-- Create a new INSERT policy that properly allows authenticated users to insert their own music
CREATE POLICY "Users can insert their own music"
  ON music
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);