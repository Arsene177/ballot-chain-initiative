import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Calendar, Users, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PublicSession {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  access_type: string;
  voter_identity_visible: boolean;
  candidates: Array<{
    id: string;
    name: string;
    description: string;
    vote_count?: number;
  }>;
  total_votes: number;
}

const PublicSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicSessions();
  }, []);

  const fetchPublicSessions = async () => {
    try {
      // Fetch all public and active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('voting_sessions')
        .select('*')
        .in('status', ['active', 'ended'])
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch candidates and vote counts for each session
      const enrichedSessions = await Promise.all(
        (sessionsData || []).map(async (session) => {
          // Get candidates
          const { data: candidates, error: candidatesError } = await supabase
            .from('candidates')
            .select('*')
            .eq('voting_session_id', session.id)
            .order('position');

          if (candidatesError) {
            console.error('Error fetching candidates:', candidatesError);
          }

          // Get vote counts
          const { count: totalVotes } = await supabase
            .from('votes')
            .select('*', { count: 'exact' })
            .eq('voting_session_id', session.id);

          // Get vote counts per candidate if session is ended or identity is visible
          let candidatesWithVotes = candidates || [];
          if (session.status === 'ended' || session.voter_identity_visible) {
            candidatesWithVotes = await Promise.all(
              (candidates || []).map(async (candidate) => {
                const { count } = await supabase
                  .from('votes')
                  .select('*', { count: 'exact' })
                  .eq('voting_session_id', session.id)
                  .eq('candidate_id', candidate.id);

                return { ...candidate, vote_count: count || 0 };
              })
            );
          }

          return {
            ...session,
            candidates: candidatesWithVotes,
            total_votes: totalVotes || 0
          };
        })
      );

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Error fetching public sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionStatus = (session: PublicSession) => {
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (now < startTime) {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'ongoing', label: 'Ongoing', color: 'bg-green-100 text-green-700' };
    } else {
      return { status: 'ended', label: 'Ended', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">BallotChain</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/admin">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <Link to="/voter">
                    <Button>Vote</Button>
                  </Link>
                </>
              ) : (
                <Link to="/auth">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Public Voting Sessions
          </h1>
          <p className="text-lg text-gray-600">
            Transparent, secure, and verifiable voting powered by blockchain technology
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
              <p className="text-gray-600">
                There are currently no public voting sessions available. Check back later!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => {
              const sessionStatus = getSessionStatus(session);
              const timeRemaining = getTimeRemaining(session.end_time);

              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={sessionStatus.color}>
                        {sessionStatus.label}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {session.access_type === 'public' ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <Shield className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="text-xs text-gray-500">
                          {session.access_type === 'public' ? 'Public' : 'Restricted'}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {session.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Timing Info */}
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{timeRemaining}</span>
                    </div>

                    {/* Vote Count */}
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {session.total_votes} vote{session.total_votes !== 1 ? 's' : ''} cast
                      </span>
                    </div>

                    {/* Candidates */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Candidates:</h4>
                      <div className="space-y-1">
                        {session.candidates.slice(0, 3).map((candidate) => (
                          <div key={candidate.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{candidate.name}</span>
                            {(session.status === 'ended' || session.voter_identity_visible) && (
                              <span className="text-gray-500">
                                {candidate.vote_count || 0} votes
                              </span>
                            )}
                          </div>
                        ))}
                        {session.candidates.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{session.candidates.length - 3} more candidates
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {sessionStatus.status === 'ongoing' ? (
                        <Link to={user ? "/voter" : "/auth"} className="block">
                          <Button className="w-full">
                            {user ? 'Vote Now' : 'Sign In to Vote'}
                          </Button>
                        </Link>
                      ) : sessionStatus.status === 'upcoming' ? (
                        <Button disabled className="w-full">
                          Voting Starts {new Date(session.start_time).toLocaleDateString()}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Voting Ended
                        </Button>
                      )}
                    </div>

                    {/* Session Details */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Starts: {new Date(session.start_time).toLocaleDateString()}</span>
                        <span>Ends: {new Date(session.end_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSessions;