/*
  # Add storage policies for music bucket

  1. Storage Policies
    - Allow authenticated users to upload files to music bucket
    - Allow authenticated users to read files from music bucket
    - Allow authenticated users to delete their own files from music bucket

  2. Security
    - Policies ensure only authenticated users can upload
    - Users can only delete files they uploaded (based on file path containing their user ID)
*/

-- Allow authenticated users to upload files to the music bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, target_roles)
VALUES (
  'music-upload-policy',
  'music',
  'Allow authenticated users to upload music',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'INSERT',
  '{authenticated}'
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read files from the music bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, target_roles)
VALUES (
  'music-read-policy',
  'music',
  'Allow authenticated users to read music',
  'auth.role() = ''authenticated''',
  NULL,
  'SELECT',
  '{authenticated}'
) ON CONFLICT (id) DO NOTHING;

-- Allow users to delete their own files (files that contain their user ID in the path)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, target_roles)
VALUES (
  'music-delete-policy',
  'music',
  'Allow users to delete their own music files',
  'auth.uid()::text = (storage.foldername(name))[1]',
  NULL,
  'DELETE',
  '{authenticated}'
) ON CONFLICT (id) DO NOTHING;