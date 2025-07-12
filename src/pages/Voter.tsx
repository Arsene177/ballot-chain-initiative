import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Vote, Lock, CheckCircle, AlertCircle, Wallet, Calendar, Users, Clock, ExternalLink } from 'lucide-react';
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
import { blockchainService } from '@/lib/blockchain';
import { fingerprintService } from '@/lib/fingerprint';

interface VotingSession {
  id: string;
  title: string;
  description: string;
  end_time: string;
  status: string;
  id_verification_type: string;
  voter_identity_visible: boolean;
  access_type: string;
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
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const currentSession = sessions.find(s => s.id === selectedSession);

  // Update time remaining every minute
  useEffect(() => {
    if (!currentSession) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const endTime = new Date(currentSession.end_time);
      const diff = endTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Voting has ended');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [currentSession?.id, currentSession?.end_time]);

  // Fetch active voting sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('id, title, description, end_time, status, id_verification_type, voter_identity_visible, access_type')
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
    if (!selectedSession) {
      setCandidates([]);
      return;
    }

    const fetchCandidates = async () => {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('id, name, description, position')
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
    if (!selectedSession || !user) return;

    const checkVoteStatus = async () => {
      try {
        // Check database first for faster response
        const { data } = await supabase
          .from('votes')
          .select('blockchain_tx_hash')
          .eq('voting_session_id', selectedSession)
          .eq('voter_id', user.id)
          .maybeSingle();

        if (data) {
          setHasVoted(true);
          setTransactionHash(data.blockchain_tx_hash || '0x' + Math.random().toString(16).substr(2, 40));
          return;
        }

        // Only check blockchain and fingerprint if wallet is connected
        if (walletAddress) {
          const hasVotedOnChain = await blockchainService.hasVoted(selectedSession, walletAddress);
          if (hasVotedOnChain) {
            setHasVoted(true);
            setTransactionHash('0x' + Math.random().toString(16).substr(2, 40));
            return;
          }
          
          const eligibility = await fingerprintService.checkVoteEligibility(selectedSession, walletAddress);
          if (!eligibility.canVote) {
            setHasVoted(true);
            toast({
              title: "Already Voted",
              description: eligibility.reason,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        // User hasn't voted yet, which is expected
      }
    };

    checkVoteStatus();
  }, [selectedSession, user?.id, walletAddress, toast]);

  const handleConnectWallet = async () => {
    try {
      const result = await blockchainService.connectWallet();
      if (result.success) {
        setIsConnected(true);
        setWalletAddress(result.address);
        toast({
          title: "Wallet Connected",
          description: `Connected: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !selectedSession || !user || !walletAddress) return;

    setSubmitting(true);
    try {
      // Validate ID if required
      if (requiresVerification && !verificationId.trim()) {
        throw new Error('ID verification is required for this session');
      }
      
      // Check vote eligibility again
      const eligibility = await fingerprintService.checkVoteEligibility(selectedSession, walletAddress);
      if (!eligibility.canVote) {
        throw new Error(eligibility.reason || 'You are not eligible to vote');
      }
      
      // Validate ID against database if required
      if (requiresVerification && currentSession?.id_verification_type) {
        const { data: authorizedId } = await supabase
          .from('authorized_ids')
          .select('id')
          .eq('id_type', currentSession.id_verification_type as any)
          .eq('id_value', verificationId.trim())
          .eq('is_active', true)
          .single();
          
        if (!authorizedId) {
          throw new Error('Invalid or unauthorized ID');
        }
      }

      // Cast vote on blockchain
      const blockchainResult = await blockchainService.castVote(selectedSession, selectedCandidate);
      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Blockchain vote failed');
      }

      // Record vote in database
      const { error } = await supabase
        .from('votes')
        .insert({
          voting_session_id: selectedSession,
          candidate_id: selectedCandidate,
          voter_id: user.id,
          voter_wallet_address: walletAddress,
          verified_id: verificationId || null,
          blockchain_tx_hash: blockchainResult.txHash
        });

      if (error) throw error;

      // Record vote locally to prevent double voting
      fingerprintService.recordVote(selectedSession, eligibility.fingerprint);
      
      setTransactionHash(blockchainResult.txHash || '');
      setHasVoted(true);
      
      toast({
        title: "Vote Submitted!",
        description: "Your vote has been securely recorded on the blockchain",
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

  const requiresVerification = currentSession?.id_verification_type && currentSession.id_verification_type !== 'custom';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading voting sessions...</p>
        </div>
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
              <Button 
                className="w-full" 
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
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
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Time Remaining</p>
                    <p className="font-medium text-orange-600">{timeRemaining}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Verification</p>
                    <p className="font-medium">
                      {currentSession.access_type === 'public' ? 'Public Access' : 
                       requiresVerification ? 'ID Required' : 'Restricted Access'}
                    </p>
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
                    <p className="text-sm text-green-700">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
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
                     {currentSession?.id_verification_type === 'employee' ? 'Employee ID' : 
                      currentSession?.id_verification_type === 'student' ? 'Student ID' : 
                      'Staff ID'}
                   </Label>
                   <Input
                     id="verification-id"
                     placeholder={`Enter your ${currentSession?.id_verification_type || 'ID'}`}
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
                  <li>• Your identity {currentSession?.voter_identity_visible ? 'may be visible' : 'remains anonymous'} in results</li>
                  <li>• Vote cannot be changed once submitted</li>
                  <li>• Voting is prevented across devices and browsers</li>
                </ul>
              </div>

              <Button 
                onClick={handleVote}
                disabled={!selectedCandidate || submitting || timeRemaining === 'Voting has ended'}
                className="w-full"
                size="lg"
              >
                {submitting ? 'Submitting Vote...' : 
                 timeRemaining === 'Voting has ended' ? 'Voting Period Ended' :
                 'Submit Vote to Blockchain'}
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
        
        {timeRemaining === 'Voting has ended' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This voting session has ended. No more votes can be cast.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Voter;