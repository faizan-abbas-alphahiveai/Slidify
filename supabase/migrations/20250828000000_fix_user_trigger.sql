/*
  # Fix user trigger function to include name fields

  1. Changes
    - Update handle_new_user() function to include first_name and last_name fields
    - This ensures new users get created with proper name fields
  
  2. Background
    - The original trigger was created before first_name and last_name columns were added
    - This caused new users to be created without name fields
    - The signup process now handles this with upsert, but the trigger should also be updated
*/

-- Update the handle_new_user function to include name fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, '', '');
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- The trigger is already created, so no need to recreate it
-- The updated function will now include the name fields
