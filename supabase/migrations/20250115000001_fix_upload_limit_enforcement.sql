-- Fix upload limit enforcement by adding database constraints
-- This migration ensures the 100 image limit is strictly enforced

-- First, let's add a check constraint to prevent current_uploads from exceeding max_uploads
-- Drop the constraint if it exists first
ALTER TABLE upload_sessions 
DROP CONSTRAINT IF EXISTS check_upload_limit;

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

-- Create a function to get the actual count of uploaded images
CREATE OR REPLACE FUNCTION get_actual_upload_count(session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  image_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO image_count
  FROM upload_session_images
  WHERE upload_session_id = session_id;
  
  RETURN image_count;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_actual_upload_count(UUID) TO anon, authenticated;

-- Create a function to safely insert images with strict limit validation
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
  v_max_uploads INTEGER;
  v_actual_count INTEGER;
  v_new_image_id UUID;
BEGIN
  -- Get session info with row lock to prevent race conditions
  SELECT id, max_uploads
  INTO v_session_id, v_max_uploads
  FROM upload_sessions
  WHERE id = p_upload_session_id
    AND is_active = true
    AND expires_at > now()
  FOR UPDATE;
  
  -- Check if session exists and is valid
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Upload session not found or has expired';
  END IF;
  
  -- Get actual count of uploaded images
  v_actual_count := get_actual_upload_count(p_upload_session_id);
  
  -- Check upload limit
  IF v_actual_count >= v_max_uploads THEN
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
  
  -- Update the current_uploads count
  UPDATE upload_sessions 
  SET current_uploads = get_actual_upload_count(p_upload_session_id),
      updated_at = now()
  WHERE id = p_upload_session_id;
  
  RETURN v_new_image_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION safe_insert_upload_session_image(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
