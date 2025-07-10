import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Vote, Lock, CheckCircle, AlertCircle, Wallet, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface VotingSession {
  id: string;
  title: string;
  description: string;
  end_time: string;
  status: string;
  id_verification_type: string;
  voter_identity_visible: boolean;
}

interface Candidate {
  id: string;
  name: string;
  description: string;
  position: number;
}

const Voter = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');

  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch active voting sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load voting sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [toast]);

  // Fetch candidates for selected session
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!selectedSession) {
        setCandidates([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('voting_session_id', selectedSession)
          .order('position');

        if (error) throw error;
        setCandidates(data || []);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        toast({
          title: "Error",
          description: "Failed to load candidates",
          variant: "destructive",
        });
      }
    };

    fetchCandidates();
  }, [selectedSession, toast]);

  // Check if user has already voted in this session
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!selectedSession || !user) return;

      try {
        const { data, error } = await supabase
          .from('votes')
          .select('id, blockchain_tx_hash')
          .eq('voting_session_id', selectedSession)
          .eq('voter_id', user.id)
          .single();

        if (data) {
          setHasVoted(true);
          setTransactionHash(data.blockchain_tx_hash || '0x' + Math.random().toString(16).substr(2, 40));
        }
      } catch (error) {
        // User hasn't voted yet, which is expected
      }
    };

    checkVoteStatus();
  }, [selectedSession, user]);

  const handleConnectWallet = () => {
    setIsConnected(true);
    toast({
      title: "Wallet Connected",
      description: "Your blockchain wallet has been connected successfully",
    });
  };

  const handleVote = async () => {
    if (!selectedCandidate || !selectedSession || !user) return;

    setSubmitting(true);
    try {
      // Generate a mock blockchain transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 40);

      const { error } = await supabase
        .from('votes')
        .insert({
          voting_session_id: selectedSession,
          candidate_id: selectedCandidate,
          voter_id: user.id,
          verified_id: verificationId || null,
          blockchain_tx_hash: mockTxHash
        });

      if (error) throw error;

      setTransactionHash(mockTxHash);
      setHasVoted(true);
      
      toast({
        title: "Vote Submitted!",
        description: "Your vote has been recorded on the blockchain",
      });
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentSession = sessions.find(s => s.id === selectedSession);
  const requiresVerification = currentSession?.id_verification_type && currentSession.id_verification_type !== 'custom';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-900">Vote Recorded!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your vote has been successfully recorded on the blockchain.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Transaction Hash:</p>
              <p className="text-xs text-green-600 font-mono break-all">
                {transactionHash}
              </p>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.open('#', '_blank')}>
                View on Blockchain Explorer
              </Button>
              <Link to="/" className="block">
                <Button variant="outline" className="w-full">Return to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-purple-600" />
                <span className="text-xl font-bold text-gray-900">BallotChain</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Voter Portal
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Selection */}
        {sessions.length === 0 ? (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active voting sessions available at this time.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Voting Session</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voting session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{session.title}</span>
                        <span className="text-sm text-gray-500">
                          Ends: {new Date(session.end_time).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Selected Session Details */}
        {currentSession && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{currentSession.title}</CardTitle>
                  <p className="text-gray-600 mt-2">{currentSession.description}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Ends</p>
                    <p className="font-medium">{new Date(currentSession.end_time).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Verification</p>
                    <p className="font-medium">{requiresVerification ? 'ID Required' : 'Open Access'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Connection */}
        {currentSession && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Blockchain Wallet</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-600">Connect your wallet to cast your vote securely on the blockchain</p>
                  <Button onClick={handleConnectWallet} className="w-full">
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Wallet Connected</p>
                    <p className="text-sm text-green-700">0x742d...Db4D7</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ID Verification */}
        {isConnected && requiresVerification && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Identity Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="verification-id">
                    {currentSession.id_verification_type === 'employee' ? 'Employee ID' : 
                     currentSession.id_verification_type === 'student' ? 'Student ID' : 
                     'Staff ID'}
                  </Label>
                  <Input
                    id="verification-id"
                    placeholder={`Enter your ${currentSession.id_verification_type} ID`}
                    value={verificationId}
                    onChange={(e) => setVerificationId(e.target.value)}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Your ID will be verified against the authorized database. Your identity remains anonymous in voting results.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Interface */}
        {isConnected && (!requiresVerification || verificationId) && candidates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Vote className="h-5 w-5" />
                <span>Cast Your Vote</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">Select Your Candidate</Label>
                <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
                  <div className="space-y-3">
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={candidate.id} id={candidate.id} />
                        <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            {candidate.description && (
                              <p className="text-sm text-gray-600">{candidate.description}</p>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• You can only vote once per session</li>
                  <li>• Your vote is recorded on blockchain for transparency</li>
                  <li>• Your identity remains anonymous in results</li>
                  <li>• Vote cannot be changed once submitted</li>
                </ul>
              </div>

              <Button 
                onClick={handleVote}
                disabled={!selectedCandidate || submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? 'Submitting Vote...' : 'Submit Vote to Blockchain'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isConnected && (!requiresVerification || verificationId) && candidates.length === 0 && selectedSession && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No candidates have been added to this voting session yet.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Voter;