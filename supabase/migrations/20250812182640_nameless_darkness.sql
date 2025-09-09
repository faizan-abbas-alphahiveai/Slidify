/*
  # Add location field to subscription_messages table

  1. Table Changes
    - Add `location` column to `subscription_messages` table
    - This field will specify where in the application the message should be displayed
    - Default value set to 'images_section' for existing records

  2. Data Updates
    - Update existing records to have location = 'images_section'
    - This maintains backward compatibility with current implementation
*/

-- Add location column to subscription_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_messages' AND column_name = 'location'
  ) THEN
    ALTER TABLE subscription_messages ADD COLUMN location text DEFAULT 'images_section' NOT NULL;
  END IF;
END $$;

-- Update existing records to have the images_section location
UPDATE subscription_messages 
SET location = 'images_section' 
WHERE location IS NULL OR location = '';

-- Add a check constraint to ensure location is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'subscription_messages' AND constraint_name = 'subscription_messages_location_check'
  ) THEN
    ALTER TABLE subscription_messages ADD CONSTRAINT subscription_messages_location_check CHECK (location <> '');
  END IF;
END $$;