/*
  # Fix music table RLS policy for uploads

  1. Security Changes
    - Update the existing INSERT policy for the `music` table to properly allow authenticated users to insert their own music
    - Ensure the policy works for all access levels (public, private, premium)
  
  2. Notes
    - This fixes the "new row violates row-level security policy" error when uploading audio files
    - The policy now properly checks that the authenticated user's ID matches the user_id being inserted
*/

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can create their own music" ON music;

-- Create a new, more permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert their own music"
  ON music
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also ensure we have a proper INSERT policy for anonymous users if needed
-- (This might be needed for some use cases, but typically music uploads require authentication)
DROP POLICY IF EXISTS "Allow anonymous users to create music" ON music;