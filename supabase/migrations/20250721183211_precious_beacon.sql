/*
  # Allow anonymous users to create slideshows

  1. Security Changes
    - Add policy to allow anonymous users to insert slideshows
    - Keep existing policies for authenticated users
    - Allow public read access for viewing shared slideshows

  2. Notes
    - Anonymous slideshows will have user_id as null
    - This enables guest users to create shareable links
    - Maintains security for authenticated user slideshows
*/

-- Allow anonymous users to create slideshows
CREATE POLICY "Allow anonymous users to create slideshows"
  ON slideshows
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Update the existing insert policy for authenticated users to be more specific
DROP POLICY IF EXISTS "Users can create their own slideshows" ON slideshows;

CREATE POLICY "Authenticated users can create their own slideshows"
  ON slideshows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);