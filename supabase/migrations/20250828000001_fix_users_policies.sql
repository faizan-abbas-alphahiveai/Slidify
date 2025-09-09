/*
  # Fix users table RLS policies

  1. Changes
    - Drop and recreate all policies for the users table to ensure they work correctly
    - Ensure users can read, insert, update their own data
    - Fix any permission issues that might prevent profile loading
  
  2. Background
    - Some users are unable to load their profile data
    - This might be due to incorrect RLS policies
    - Recreating all policies should resolve the issue
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Recreate policies with proper syntax
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure the trigger function is working correctly
-- This will recreate the function if it doesn't exist or update it if it does
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, '', '')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;
