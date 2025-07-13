-- Create a test public voting session that's currently active
INSERT INTO public.voting_sessions (
  title,
  description,
  creator_id,
  access_type,
  start_time,
  end_time,
  status
) VALUES (
  'Test Public Vote - Live Now',
  'This is a test voting session to verify public visibility across all pages. This session should be visible to everyone, including anonymous users.',
  (SELECT id FROM auth.users LIMIT 1),
  'public',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '24 hours',
  'active'
);

-- Add candidates to the test session
INSERT INTO public.candidates (
  voting_session_id,
  name,
  description,
  position
) VALUES 
(
  (SELECT id FROM public.voting_sessions WHERE title = 'Test Public Vote - Live Now'),
  'Candidate A',
  'First test candidate',
  1
),
(
  (SELECT id FROM public.voting_sessions WHERE title = 'Test Public Vote - Live Now'),
  'Candidate B', 
  'Second test candidate',
  2
),
(
  (SELECT id FROM public.voting_sessions WHERE title = 'Test Public Vote - Live Now'),
  'Candidate C',
  'Third test candidate', 
  3
);