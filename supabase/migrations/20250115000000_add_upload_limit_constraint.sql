-- Add constraint to prevent uploads when limit is reached
-- This ensures the upload limit is enforced at the database level

-- First, let's add a check constraint to the upload_sessions table
ALTER TABLE upload_sessions 
ADD CONSTRAINT check_upload_limit 
CHECK (current_uploads <= max_uploads);

-- Update the RLS policy to be more strict about upload limits
DROP POLICY IF EXISTS "Anyone can upload to active sessions" ON upload_session_images;

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

-- Add a function to safely insert images with upload limit validation
CREATE OR REPLACE FUNCTION safe_insert_upload_session_image(
  p_upload_session_id UUID,
  p_image_url TEXT,
  p_uploaded_by_name TEXT DEFAULT '',
  p_uploaded_by_email TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_current_uploads INTEGER;
  v_max_uploads INTEGER;
  v_new_image_id UUID;
BEGIN
  -- Get session info with row lock to prevent race conditions
  SELECT id, current_uploads, max_uploads
  INTO v_session_id, v_current_uploads, v_max_uploads
  FROM upload_sessions
  WHERE id = p_upload_session_id
    AND is_active = true
    AND expires_at > now()
  FOR UPDATE;
  
  -- Check if session exists and is valid
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Upload session not found or has expired';
  END IF;
  
  -- Check upload limit
  IF v_current_uploads >= v_max_uploads THEN
    RAISE EXCEPTION 'Upload limit reached. Maximum % images allowed.', v_max_uploads;
  END IF;
  
  -- Insert the image
  INSERT INTO upload_session_images (
    upload_session_id,
    image_url,
    uploaded_by_name,
    uploaded_by_email
  ) VALUES (
    p_upload_session_id,
    p_image_url,
    p_uploaded_by_name,
    p_uploaded_by_email
  ) RETURNING id INTO v_new_image_id;
  
  -- The trigger will automatically increment current_uploads
  
  RETURN v_new_image_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION safe_insert_upload_session_image(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
