/*
  # Create upload sessions for collaborative slideshow creation

  1. New Tables
    - `upload_sessions`
      - `id` (uuid, primary key)
      - `slideshow_id` (uuid, foreign key to slideshows)
      - `creator_user_id` (uuid, foreign key to auth.users)
      - `session_token` (text, unique token for sharing)
      - `max_uploads` (integer, maximum number of images that can be uploaded)
      - `current_uploads` (integer, current number of uploaded images)
      - `expires_at` (timestamp, when the session expires)
      - `is_active` (boolean, whether session is still accepting uploads)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `upload_session_images`
      - `id` (uuid, primary key)
      - `upload_session_id` (uuid, foreign key to upload_sessions)
      - `image_url` (text, URL to uploaded image)
      - `uploaded_by_name` (text, optional name of uploader)
      - `uploaded_by_email` (text, optional email of uploader)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for session creators to manage their sessions
    - Add policies for public access to upload to active sessions
    - Add policies for session creators to view uploaded images

  3. Functions
    - Function to generate unique session tokens
    - Function to check if session can accept more uploads
*/

-- Create upload_sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slideshow_id uuid REFERENCES slideshows(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  max_uploads integer DEFAULT 100 NOT NULL,
  current_uploads integer DEFAULT 0 NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create upload_session_images table
CREATE TABLE IF NOT EXISTS upload_session_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_session_id uuid NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  uploaded_by_name text DEFAULT '',
  uploaded_by_email text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_session_images ENABLE ROW LEVEL SECURITY;

-- Policies for upload_sessions
CREATE POLICY "Session creators can manage their sessions"
  ON upload_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = creator_user_id)
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Public can read active sessions by token"
  ON upload_sessions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND expires_at > now());

-- Policies for upload_session_images
CREATE POLICY "Anyone can upload to active sessions"
  ON upload_session_images
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    upload_session_id IN (
      SELECT id FROM upload_sessions 
      WHERE is_active = true 
      AND expires_at > now() 
      AND current_uploads < max_uploads
    )
  );

CREATE POLICY "Session creators can view uploaded images"
  ON upload_session_images
  FOR SELECT
  TO authenticated
  USING (
    upload_session_id IN (
      SELECT id FROM upload_sessions WHERE creator_user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_sessions_token ON upload_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_creator ON upload_sessions(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_upload_session_images_session ON upload_session_images(upload_session_id);

-- Add trigger for updated_at
CREATE TRIGGER update_upload_sessions_updated_at
  BEFORE UPDATE ON upload_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment upload count when image is added
CREATE OR REPLACE FUNCTION increment_session_upload_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE upload_sessions 
  SET current_uploads = current_uploads + 1,
      updated_at = now()
  WHERE id = NEW.upload_session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment upload count
CREATE TRIGGER increment_upload_count_trigger
  AFTER INSERT ON upload_session_images
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_upload_count();

-- Function to decrement upload count when image is removed
CREATE OR REPLACE FUNCTION decrement_session_upload_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE upload_sessions 
  SET current_uploads = current_uploads - 1,
      updated_at = now()
  WHERE id = OLD.upload_session_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically decrement upload count
CREATE TRIGGER decrement_upload_count_trigger
  AFTER DELETE ON upload_session_images
  FOR EACH ROW
  EXECUTE FUNCTION decrement_session_upload_count();