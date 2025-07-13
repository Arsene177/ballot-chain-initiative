-- Create additional test sessions to verify the filtering logic
INSERT INTO public.voting_sessions (
  title,
  description,
  creator_id,
  access_type,
  start_time,
  end_time,
  status
) VALUES 
(
  'Upcoming Public Vote',
  'This session starts in a few hours and should be visible on all public pages.',
  (SELECT id FROM auth.users LIMIT 1),
  'public',
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '26 hours',
  'scheduled'
),
(
  'Future Public Vote',
  'This session starts tomorrow and should be visible in the upcoming section.',
  (SELECT id FROM auth.users LIMIT 1),
  'public',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  'scheduled'
);

-- Add candidates to these test sessions
INSERT INTO public.candidates (
  voting_session_id,
  name,
  description,
  position
) VALUES 
-- Candidates for "Upcoming Public Vote"
(
  (SELECT id FROM public.voting_sessions WHERE title = 'Upcoming Public Vote'),
  'Option 1',
  'First option for upcoming vote',
  1
),
(
  (SELECT id FROM public.voting_sessions WHERE title = 'Upcoming Public Vote'),
  'Option 2',
  'Second option for upcoming vote',
  2
),
-- Candidates for "Future Public Vote"
(
  (SELECT id FROM public.voting_sessions WHERE title = 'Future Public Vote'),
  'Choice A',
  'First choice for future vote',
  1
),
(
  (SELECT id FROM public.voting_sessions WHERE title = 'Future Public Vote'),
  'Choice B',
  'Second choice for future vote',
  2
);