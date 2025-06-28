
-- Create enum for voting access types
CREATE TYPE public.voting_access_type AS ENUM ('public', 'organization', 'restricted');

-- Create enum for ID verification types
CREATE TYPE public.id_verification_type AS ENUM ('employee', 'student', 'staff', 'custom');

-- Create enum for voting session status
CREATE TYPE public.voting_status AS ENUM ('draft', 'scheduled', 'active', 'ended');

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'initiator', 'voter');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role DEFAULT 'voter',
  organization_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create authorized_ids table for ID verification
CREATE TABLE public.authorized_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_type id_verification_type NOT NULL,
  id_value TEXT NOT NULL,
  organization_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_type, id_value, organization_id)
);

-- Create voting_sessions table
CREATE TABLE public.voting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  access_type voting_access_type DEFAULT 'public',
  id_verification_type id_verification_type,
  organization_id TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status voting_status DEFAULT 'draft',
  voter_identity_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voting_session_id UUID REFERENCES public.voting_sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voting_session_id UUID REFERENCES public.voting_sessions(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id),
  voter_wallet_address TEXT,
  verified_id TEXT,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voting_session_id, voter_id),
  UNIQUE(voting_session_id, voter_wallet_address)
);

-- Create system_settings table for admin controls
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for authorized_ids (admin only)
CREATE POLICY "Admins can manage authorized IDs" ON public.authorized_ids
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for voting_sessions
CREATE POLICY "Anyone can view active voting sessions" ON public.voting_sessions
  FOR SELECT USING (status = 'active' OR status = 'ended');

CREATE POLICY "Initiators can manage their sessions" ON public.voting_sessions
  FOR ALL USING (
    creator_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'initiator')
    )
  );

-- RLS Policies for candidates
CREATE POLICY "Anyone can view candidates for active sessions" ON public.candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.voting_sessions 
      WHERE id = voting_session_id AND status IN ('active', 'ended')
    )
  );

CREATE POLICY "Session creators can manage candidates" ON public.candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.voting_sessions 
      WHERE id = voting_session_id AND creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for votes
CREATE POLICY "Users can insert their own votes" ON public.votes
  FOR INSERT WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Session creators can view vote counts" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.voting_sessions 
      WHERE id = voting_session_id AND creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for system_settings (admin only)
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('voter_identity_visible', 'false'),
  ('blockchain_network', '"sepolia"'),
  ('require_email_verification', 'true');
