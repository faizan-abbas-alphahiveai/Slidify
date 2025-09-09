/*
  # Create storage buckets for slideshow files

  1. Storage Buckets
    - `slideshow-images` - For storing slideshow image files
    - `slideshow-audio` - For storing slideshow audio files
  
  2. Security
    - Public read access for viewing shared slideshows
    - Authenticated users can upload files
    - Users can only delete their own files
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('slideshow-images', 'slideshow-images', true),
  ('slideshow-audio', 'slideshow-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for slideshow images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'slideshow-images');

CREATE POLICY "Public read access for slideshow audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'slideshow-audio');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'slideshow-images');

CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'slideshow-audio');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'slideshow-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'slideshow-audio' AND auth.uid()::text = (storage.foldername(name))[1]);