/*
  # Add sample subscription messages

  1. New Data
    - Add sample subscription messages for different user types and locations
    - Messages for authenticated users in images section
    - Messages for unauthenticated users in images section
    - Messages for premium users in images section

  2. Purpose
    - Provide contextual messaging based on user subscription status
    - Enhance user experience with targeted content
*/

-- Insert sample subscription messages
INSERT INTO subscription_messages (subscription_type, location, message, is_active, user_id) VALUES
  ('authenticated', 'images_section', 'Welcome back! Upload your images to create another amazing slideshow.', true, null),
  ('unauthenticated', 'images_section', 'Start by uploading your images - no account required to get started!', true, null),
  ('premium', 'images_section', 'Premium users can upload unlimited images and access advanced features.', true, null),
  ('authenticated', 'music_section', 'Choose from our music library or upload your own audio tracks.', true, null),
  ('unauthenticated', 'music_section', 'Add background music to make your slideshow more engaging.', true, null),
  ('premium', 'music_section', 'Premium members have access to our full music library and custom uploads.', true, null);