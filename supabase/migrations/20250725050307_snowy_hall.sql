/*
  # Create share messages table

  1. New Tables
    - `share_messages`
      - `id` (uuid, primary key)
      - `message` (text, the share message text)
      - `is_active` (boolean, whether message is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to users table, nullable for admin messages)

  2. Security
    - Enable RLS on `share_messages` table
    - Add policy for public read access to active messages
    - Add policy for authenticated users to manage their own messages

  3. Sample Data
    - Insert default share messages for variety
*/

CREATE TABLE IF NOT EXISTS share_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE share_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active share messages
CREATE POLICY "Allow public read access to active share messages"
  ON share_messages
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Allow authenticated users to create their own share messages
CREATE POLICY "Users can create share messages"
  ON share_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own share messages
CREATE POLICY "Users can read their own share messages"
  ON share_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own share messages
CREATE POLICY "Users can update their own share messages"
  ON share_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own share messages
CREATE POLICY "Users can delete their own share messages"
  ON share_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_share_messages_updated_at
  BEFORE UPDATE ON share_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default share messages (these will have user_id as NULL, making them system messages)
INSERT INTO share_messages (message, user_id) VALUES
  ('Your slideshow is ready to share with the world!', NULL),
  ('Amazing! Your slideshow is complete and ready to share!', NULL),
  ('Fantastic! Your slideshow is now ready for everyone to see!', NULL),
  ('Perfect! Your slideshow has been created successfully!', NULL),
  ('Wonderful! Your slideshow is ready to be shared!', NULL),
  ('Excellent! Your slideshow is complete and shareable!', NULL),
  ('Great job! Your slideshow is ready to go live!', NULL),
  ('Success! Your slideshow is now ready for sharing!', NULL),
  ('Awesome! Your slideshow has been created and is ready!', NULL),
  ('Brilliant! Your slideshow is complete and ready to share!', NULL);