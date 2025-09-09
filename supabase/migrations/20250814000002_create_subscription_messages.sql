-- Create subscription_messages table for dynamic section messages
CREATE TABLE IF NOT EXISTS subscription_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL CHECK (location IN ('images_section', 'music_section', 'settings_section')),
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('unauthenticated', 'authenticated', 'premium')),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate messages for same location + subscription type
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_messages_unique 
ON subscription_messages(location, subscription_type) 
WHERE is_active = TRUE;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_subscription_messages_query 
ON subscription_messages(location, subscription_type, is_active);

-- Enable RLS
ALTER TABLE subscription_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read active subscription messages"
  ON subscription_messages
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Create policy for admins to manage messages (you can adjust this based on your needs)
CREATE POLICY "Admins can manage subscription messages"
  ON subscription_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@example.com') -- Adjust admin emails as needed
    )
  );

-- Insert sample messages for testing
INSERT INTO subscription_messages (location, subscription_type, message, is_active) VALUES
-- Images Section Messages
('images_section', 'unauthenticated', 'Upload images to create your slideshow. [Sign up](https://example.com) for more features!', true),
('images_section', 'authenticated', 'This is for AUTHENTICATED [icon:Users] users. Upload up to 10 images.', true),
('images_section', 'premium', '[icon:Users: text-purple-500] **Premium Features:** Invite others to submit images [Visit Slidify](https://slidify.com)', true),

-- Music Section Messages  
('music_section', 'unauthenticated', 'Enhance your slideshow with background music.', true),
('music_section', 'authenticated', 'Access our music library or upload your own tracks.', true),
('music_section', 'premium', 'Premium members get unlimited access to our full music library.', true),

-- Settings Section Messages
('settings_section', 'unauthenticated', 'Customize your slideshow settings. [Upgrade](https://example.com) for advanced options.', true),
('settings_section', 'authenticated', 'Basic settings available. Upgrade to premium for advanced customization.', true),
('settings_section', 'premium', 'Settings message for premium users. You have access to all customization options.', true)
ON CONFLICT (location, subscription_type) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_messages_updated_at
  BEFORE UPDATE ON subscription_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_messages_updated_at();
