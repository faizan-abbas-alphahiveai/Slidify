/*
  # Add view count tracking to slideshows

  1. Schema Changes
    - Add `view_count` column to `slideshows` table
    - Set default value to 0 for existing records
    - Add index for performance on view count queries

  2. Data Migration
    - Initialize all existing slideshows with view_count = 0

  This migration enables tracking of how many times each slideshow has been viewed.
*/

-- Add view_count column to slideshows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slideshows' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE slideshows ADD COLUMN view_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create index for performance on view count queries
CREATE INDEX IF NOT EXISTS idx_slideshows_view_count ON slideshows(view_count DESC);

-- Update existing records to have view_count = 0 (in case they were created before this migration)
UPDATE slideshows SET view_count = 0 WHERE view_count IS NULL;