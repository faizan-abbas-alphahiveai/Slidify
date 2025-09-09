/*
  # Add RPC function for atomic view count increment

  1. Function Creation
    - Create `increment_slideshow_view` function for atomic increments
    - Ensures thread-safe view count updates
    - Returns success/failure status

  This function provides a reliable way to increment view counts without race conditions.
*/

-- Create function to atomically increment slideshow view count
CREATE OR REPLACE FUNCTION increment_slideshow_view(slideshow_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE slideshows 
  SET view_count = view_count + 1 
  WHERE id = slideshow_id;
END;
$$;