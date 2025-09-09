-- Add soft delete columns to upload_session_images table
ALTER TABLE upload_session_images 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_upload_session_images_deleted 
ON upload_session_images(is_deleted, deleted_at);

-- Create function to delete upload session images (bypasses RLS)
CREATE OR REPLACE FUNCTION delete_upload_session_image(image_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the image record
  DELETE FROM upload_session_images WHERE id = image_id;
  
  -- Return true if deletion was successful
  RETURN FOUND;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_upload_session_image(UUID) TO authenticated;

-- Add RLS policy for deletion (if it doesn't exist)
DROP POLICY IF EXISTS "Session creators can delete uploaded images" ON upload_session_images;
CREATE POLICY "Session creators can delete uploaded images"
  ON upload_session_images
  FOR DELETE
  TO authenticated
  USING (
    upload_session_id IN (
      SELECT id FROM upload_sessions WHERE creator_user_id = auth.uid()
    )
  );

-- Add RLS policy for updating (for soft delete)
DROP POLICY IF EXISTS "Session creators can update uploaded images" ON upload_session_images;
CREATE POLICY "Session creators can update uploaded images"
  ON upload_session_images
  FOR UPDATE
  TO authenticated
  USING (
    upload_session_id IN (
      SELECT id FROM upload_sessions WHERE creator_user_id = auth.uid()
    )
  );
