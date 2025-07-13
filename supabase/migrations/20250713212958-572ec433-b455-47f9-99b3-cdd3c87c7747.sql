-- Remove the problematic trigger and functions
DROP TRIGGER IF EXISTS update_session_statuses_trigger ON public.voting_sessions;
DROP FUNCTION IF EXISTS public.trigger_update_session_statuses();
DROP FUNCTION IF EXISTS public.update_voting_session_statuses();

-- Update the test session status manually
UPDATE public.voting_sessions 
SET status = 'active' 
WHERE title = 'Test Public Vote - Live Now' 
  AND start_time <= now() 
  AND end_time > now();