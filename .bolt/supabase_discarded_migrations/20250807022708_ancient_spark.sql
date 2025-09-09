/*
  # Collaborative Upload Sessions

  1. New Tables
    - `upload_sessions`
      - `id` (uuid, primary key)
      - `slideshow_id` (uuid, optional reference to slideshows)
      - `creator_user_id` (uuid, references auth.users)
      - `session_token` (text, unique token for sharing)
      - `max_uploads` (integer, default 100)
      - `current_uploads` (integer, default 0)
      - `expires_at` (timestamptz, default 7 days from creation)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `upload_session_images`
      - `id` (uuid, primary key)
      - `upload_session_id` (uuid, references upload_sessions)
      - `image_url` (text, URL to uploaded image)
      - `uploaded_by_name` (text, optional contributor name)
      - `uploaded_by_email` (text, optional contributor email)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Session creators can manage their sessions
    - Public can read active sessions by token
    - Anyone can upload to active sessions
    - Session creators can view uploaded images

  3. Functions & Triggers
    - Auto-increment/decrement upload counts
    - Updated_at trigger for sessions
*/

-- Create upload_sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slideshow_id uuid REFERENCES slideshows(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
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

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Session creators can manage their sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Public can read active sessions by token" ON upload_sessions;
DROP POLICY IF EXISTS "Anyone can upload to active sessions" ON upload_session_images;
DROP POLICY IF EXISTS "Session creators can view uploaded images" ON upload_session_images;

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

-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS increment_upload_count_trigger ON upload_session_images;
DROP TRIGGER IF EXISTS decrement_upload_count_trigger ON upload_session_images;

-- Trigger to automatically increment upload count
CREATE TRIGGER increment_upload_count_trigger
  AFTER INSERT ON upload_session_images
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_upload_count();

-- Trigger to automatically decrement upload count
CREATE TRIGGER decrement_upload_count_trigger
  AFTER DELETE ON upload_session_images
  FOR EACH ROW
  EXECUTE FUNCTION decrement_session_upload_count();