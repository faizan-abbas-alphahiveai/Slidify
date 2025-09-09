/*
  # Create slideshows table and storage buckets

  1. New Tables
    - `slideshows`
      - `id` (uuid, primary key)
      - `name` (text)
      - `audio_url` (text)
      - `slide_urls` (text array)
      - `slide_duration` (integer)
      - `transition_type` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create `slideshow-audio` bucket for audio files
    - Create `slideshow-images` bucket for image files

  3. Security
    - Enable RLS on `slideshows` table
    - Add policies for public access (since no auth is implemented)
    - Set up storage policies for public access
*/

-- Create slideshows table
CREATE TABLE IF NOT EXISTS slideshows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  audio_url text,
  slide_urls text[] DEFAULT '{}',
  slide_duration integer DEFAULT 3,
  transition_type text DEFAULT 'fade',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE slideshows ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required)
CREATE POLICY "Allow public access to slideshows"
  ON slideshows
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('slideshow-audio', 'slideshow-audio', true),
  ('slideshow-images', 'slideshow-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Allow public uploads to slideshow-audio"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'slideshow-audio');

CREATE POLICY "Allow public access to slideshow-audio"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'slideshow-audio');

CREATE POLICY "Allow public uploads to slideshow-images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'slideshow-images');

CREATE POLICY "Allow public access to slideshow-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'slideshow-images');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_slideshows_updated_at
  BEFORE UPDATE ON slideshows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();