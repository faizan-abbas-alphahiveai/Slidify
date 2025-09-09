/*
  # Create slideshow shares tracking table

  1. New Tables
    - `slideshow_shares`
      - `id` (uuid, primary key)
      - `slideshow_id` (uuid, foreign key to slideshows)
      - `share_platform` (text, platform where shared)
      - `user_id` (uuid, foreign key to auth.users, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `slideshow_shares` table
    - Add policies for anonymous and authenticated users to insert shares
    - Add policy for slideshow owners to read their slideshow shares

  3. Indexes
    - Add index on slideshow_id for efficient querying
    - Add index on created_at for time-based analytics
*/

CREATE TABLE IF NOT EXISTS slideshow_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slideshow_id uuid NOT NULL REFERENCES slideshows(id) ON DELETE CASCADE,
  share_platform text NOT NULL CHECK (share_platform IN ('facebook', 'twitter', 'whatsapp', 'email', 'copy')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE slideshow_shares ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert share records (for tracking purposes)
CREATE POLICY "Allow anyone to record shares"
  ON slideshow_shares
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow slideshow owners to read shares of their slideshows
CREATE POLICY "Slideshow owners can read their slideshow shares"
  ON slideshow_shares
  FOR SELECT
  TO authenticated
  USING (
    slideshow_id IN (
      SELECT id FROM slideshows WHERE user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_slideshow_shares_slideshow_id ON slideshow_shares(slideshow_id);
CREATE INDEX IF NOT EXISTS idx_slideshow_shares_created_at ON slideshow_shares(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slideshow_shares_platform ON slideshow_shares(share_platform);