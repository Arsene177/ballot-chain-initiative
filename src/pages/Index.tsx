
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Vote, BarChart3, Lock, Eye, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/UserMenu';
import { supabase } from '@/integrations/supabase/client';

interface PublicSession {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  access_type: string;
}

const Index = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<PublicSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('id, title, description, start_time, end_time, status, access_type')
          .eq('access_type', 'public')
          .gte('end_time', now)
          .lte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(3);

        if (error) throw error;
        setActiveSessions(data || []);
      } catch (error) {
        console.error('Error fetching active sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchActiveSessions();
  }, []);

  const getSessionStatus = (session: PublicSession) => {
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (now < startTime) {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'ongoing', label: 'Live Now', color: 'bg-green-100 text-green-700' };
    } else {
      return { status: 'ended', label: 'Ended', color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
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
                    <Button variant="outline">Admin Portal</Button>
                  </Link>
                  <Link to="/initiator">
                    <Button variant="outline">Create Vote</Button>
                  </Link>
                  <Link to="/sessions">
                    <Button variant="outline">View Sessions</Button>
                  </Link>
                  <Link to="/voter">
                    <Button>Vote Now</Button>
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <>
                  <Link to="/sessions">
                    <Button variant="outline">View Sessions</Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link to="/auth">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure. Transparent. 
            <span className="text-blue-600"> Democratic.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Revolutionary blockchain-powered voting platform ensuring every vote is secure, 
            verifiable, and tamper-proof. Built for organizations, institutions, and communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to="/initiator">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Voting Session
                  </Button>
                </Link>
                <Link to="/sessions">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Public Sessions
                  </Button>
                </Link>
                <Link to="/voter">
                  <Button size="lg" className="w-full sm:w-auto">
                    Cast Your Vote
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/sessions">
                  <Button size="lg" className="w-full sm:w-auto">
                    View Public Sessions
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Active Sessions Preview */}
        {!loadingSessions && activeSessions.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Live Voting Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {activeSessions.map((session) => {
                const sessionStatus = getSessionStatus(session);
                return (
                  <Card key={session.id} className="hover:shadow-lg transition-shadow border-blue-200">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={sessionStatus.color}>
                          {sessionStatus.label}
                        </Badge>
                        <Eye className="h-4 w-4 text-green-600" />
                      </div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {session.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>Ends: {new Date(session.end_time).toLocaleDateString()}</span>
                      </div>
                      <Link to={user ? "/voter" : "/sessions"} className="block">
                        <Button className="w-full" size="sm">
                          {sessionStatus.status === 'ongoing' ? 'Vote Now' : 'View Details'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center">
              <Link to="/sessions">
                <Button variant="outline" size="lg">
                  View All Public Sessions
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Blockchain Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Every vote is recorded on the blockchain, ensuring immutable and verifiable results.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Identity Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced ID verification system supporting employee, student, and custom ID validation.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comprehensive dashboard with live voting statistics and participation metrics.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Roles Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Built for Every Stakeholder
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
              <CardHeader className="bg-blue-50">
                <Eye className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-blue-900">System Administrator</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Global voting statistics
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Identity verification controls
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Authorized ID database management
                  </li>
                </ul>
                <Link to={user ? "/admin" : "/auth"} className="block mt-6">
                  <Button className="w-full">
                    {user ? "Access Admin Portal" : "Sign In to Continue"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
              <CardHeader className="bg-green-50">
                <Vote className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-green-900">Vote Initiator</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Create voting sessions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Configure privacy settings
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    View voting results
                  </li>
                </ul>
                <Link to={user ? "/initiator" : "/auth"} className="block mt-6">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    {user ? "Create Vote" : "Sign In to Continue"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200">
              <CardHeader className="bg-purple-50">
                <Lock className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-purple-900">Voter</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Secure one-time voting
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    ID verification when required
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Blockchain confirmation
                  </li>
                </ul>
                <Link to={user ? "/voter" : "/auth"} className="block mt-6">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    {user ? "Cast Vote" : "Sign In to Continue"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold">BallotChain</span>
          </div>
          <p className="text-gray-400">
            Revolutionizing democracy through blockchain technology
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
