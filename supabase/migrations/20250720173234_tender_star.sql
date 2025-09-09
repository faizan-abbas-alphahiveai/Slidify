/*
  # Add message and loop features to slideshows

  1. New Columns
    - `message` (text) - Creator's message to recipients
    - `loop_enabled` (boolean) - Whether slideshow should loop, default false

  2. Changes
    - Add message column for creator notes
    - Add loop_enabled column with default false
    - Update existing records to have empty message and loop disabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slideshows' AND column_name = 'message'
  ) THEN
    ALTER TABLE slideshows ADD COLUMN message text DEFAULT '' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slideshows' AND column_name = 'loop_enabled'
  ) THEN
    ALTER TABLE slideshows ADD COLUMN loop_enabled boolean DEFAULT false NOT NULL;
  END IF;
END $$;