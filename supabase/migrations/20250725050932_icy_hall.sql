/*
  # Add IconName field to share_messages table

  1. Changes
    - Add `icon_name` column to `share_messages` table
    - Set default value to 'SquareUserRound' (current icon)
    - Update all existing records to use 'SquareUserRound'

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add icon_name column to share_messages table
ALTER TABLE share_messages 
ADD COLUMN icon_name text DEFAULT 'SquareUserRound' NOT NULL;

-- Update all existing records to use the current icon
UPDATE share_messages 
SET icon_name = 'SquareUserRound' 
WHERE icon_name IS NULL OR icon_name = '';

-- Add a check constraint to ensure valid icon names (optional, for data integrity)
ALTER TABLE share_messages 
ADD CONSTRAINT share_messages_icon_name_check 
CHECK (icon_name != '');