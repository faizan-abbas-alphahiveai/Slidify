/*
  # Create music storage bucket and policies

  1. Storage Setup
    - Create `music` storage bucket if it doesn't exist
    - Set bucket to be private (not public)
  
  2. Storage Policies
    - Allow authenticated users to upload files to music bucket
    - Allow authenticated users to read their own uploaded files
    - Allow authenticated users to delete their own uploaded files
    - Allow public read access for files marked as public in the music table
*/

-- Create the music bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music',
  'music',
  false,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload music files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read their own music files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own music files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read public music files" ON storage.objects;

-- Allow authenticated users to upload files to the music bucket
CREATE POLICY "Authenticated users can upload music files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own uploaded files
CREATE POLICY "Authenticated users can read their own music files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'music' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own uploaded files
CREATE POLICY "Authenticated users can delete their own music files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'music' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access for music files (needed for playback)
CREATE POLICY "Public can read music files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'music');