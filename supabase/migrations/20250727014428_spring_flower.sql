/*
  # Fix user feedback RLS policy

  1. Security Changes
    - Drop existing restrictive INSERT policy on user_feedback table
    - Create new policy that allows both authenticated and anonymous users to submit feedback
    - Authenticated users can submit with their user_id
    - Anonymous users can submit with user_id as NULL

  This resolves the "new row violates row-level security policy" error when submitting feedback.
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback;

-- Create a new policy that allows both authenticated and anonymous submissions
CREATE POLICY "Allow feedback submissions from authenticated and anonymous users"
  ON public.user_feedback
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );