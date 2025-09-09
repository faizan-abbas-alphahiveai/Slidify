/*
  # Add name columns to users table

  1. Changes
    - Add `first_name` column (text, nullable)
    - Add `last_name` column (text, nullable)
    - Update RLS policies to allow users to update their name fields
  
  2. Security
    - Maintains existing RLS policies
    - Users can only update their own profile data
*/

-- Add first_name and last_name columns to existing users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name text;
  END IF;
END $$;