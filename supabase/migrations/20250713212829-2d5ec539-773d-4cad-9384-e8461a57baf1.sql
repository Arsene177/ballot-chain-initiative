-- Create a function to automatically update voting session statuses
CREATE OR REPLACE FUNCTION public.update_voting_session_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update scheduled sessions to active when start time has passed
  UPDATE public.voting_sessions 
  SET status = 'active', updated_at = now()
  WHERE status = 'scheduled' 
    AND start_time <= now() 
    AND end_time > now();
    
  -- Update active sessions to ended when end time has passed
  UPDATE public.voting_sessions 
  SET status = 'ended', updated_at = now()
  WHERE status = 'active' 
    AND end_time <= now();
END;
$$;

-- Create a trigger to run this function periodically
-- Note: This will run on any voting_sessions table update, which will help keep statuses current
CREATE OR REPLACE FUNCTION public.trigger_update_session_statuses()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update all session statuses when any session is modified
  PERFORM public.update_voting_session_statuses();
  RETURN NEW;
END;
$$;

-- Create the trigger (but only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_session_statuses_trigger'
  ) THEN
    CREATE TRIGGER update_session_statuses_trigger
      AFTER INSERT OR UPDATE ON public.voting_sessions
      FOR EACH STATEMENT
      EXECUTE FUNCTION public.trigger_update_session_statuses();
  END IF;
END;
$$;