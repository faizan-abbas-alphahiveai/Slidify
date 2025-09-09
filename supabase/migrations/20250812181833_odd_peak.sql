/*
  # Create subscription messages table

  1. New Tables
    - `subscription_messages`
      - `id` (uuid, primary key)
      - `subscription_type` (text, enum: unauthenticated, authenticated, premium)
      - `message` (text, HTML formatted content)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `subscription_messages` table
    - Add policy for public read access to active messages
    - Add policy for authenticated users to manage their own messages

  3. Sample Data
    - Insert default messages for each subscription type
*/

CREATE TABLE IF NOT EXISTS subscription_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_type text NOT NULL CHECK (subscription_type IN ('unauthenticated', 'authenticated', 'premium')),
  message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE subscription_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active subscription messages"
  ON subscription_messages
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can create subscription messages"
  ON subscription_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own subscription messages"
  ON subscription_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription messages"
  ON subscription_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscription messages"
  ON subscription_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_messages_updated_at
  BEFORE UPDATE ON subscription_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_messages_updated_at();

-- Insert default messages for each subscription type
INSERT INTO subscription_messages (subscription_type, message, user_id) VALUES
(
  'unauthenticated',
  '<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
    <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎯 Want to save your slideshows?</h3>
    <p class="text-blue-700 dark:text-blue-300 text-sm mb-3">Sign up for a free account to save, edit, and manage all your slideshows in one place!</p>
    <div class="flex flex-wrap gap-2 text-xs text-blue-600 dark:text-blue-400">
      <span class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">✓ Save unlimited slideshows</span>
      <span class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">✓ Edit anytime</span>
      <span class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">✓ Track views & shares</span>
    </div>
  </div>',
  NULL
),
(
  'authenticated',
  '<div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-4">
    <h3 class="font-semibold text-purple-800 dark:text-purple-200 mb-2">🚀 Unlock Premium Features</h3>
    <p class="text-purple-700 dark:text-purple-300 text-sm mb-3">Upgrade to Premium for unlimited images, exclusive music, and collaborative features!</p>
    <div class="flex flex-wrap gap-2 text-xs text-purple-600 dark:text-purple-400">
      <span class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">✓ Unlimited images</span>
      <span class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">✓ Premium music library</span>
      <span class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">✓ Collaborative uploads</span>
    </div>
  </div>',
  NULL
),
(
  'premium',
  '<div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-4">
    <h3 class="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">👑 Premium Member</h3>
    <p class="text-purple-700 dark:text-purple-300 text-sm mb-3">You have access to all premium features! Create unlimited slideshows with advanced options.</p>
    <div class="flex flex-wrap gap-2 text-xs text-purple-600 dark:text-purple-400">
      <span class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">✓ Unlimited everything</span>
      <span class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">✓ Priority support</span>
      <span class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">✓ Early access to features</span>
    </div>
  </div>',
  NULL
);