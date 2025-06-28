
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Vote, Lock, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Voter = () => {
  const [selectedCandidate, setSelectedCandidate] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');
  const [isConnected, setIsConnected] = React.useState(false);
  const [hasVoted, setHasVoted] = React.useState(false);

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setIsConnected(true);
  };

  const handleVote = () => {
    if (selectedCandidate && employeeId) {
      setHasVoted(true);
    }
  };

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
                0x742d35Cc6634C0532925a3b8D4c32d8eCa2Db4D7
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
                <span className="text-xl font-bold text-gray-900">Secure Voting</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Voter Portal
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Notice */}
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Security Notice:</strong> Private/Incognito browsing detected. Please use regular browsing mode to ensure vote validation.
          </AlertDescription>
        </Alert>

        {/* Active Voting Session */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">University President Election 2024</CardTitle>
                <p className="text-gray-600 mt-2">Choose the next student body president to represent your interests</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ends</p>
                <p className="font-medium">Dec 15, 2024</p>
              </div>
              <div>
                <p className="text-gray-500">Total Votes</p>
                <p className="font-medium">1,247</p>
              </div>
              <div>
                <p className="text-gray-500">Participants</p>
                <p className="font-medium">8,934</p>
              </div>
              <div>
                <p className="text-gray-500">Access Type</p>
                <p className="font-medium">Student ID Required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection */}
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

        {/* ID Verification */}
        {isConnected && (
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
                  <Label htmlFor="employee-id">Student ID</Label>
                  <Input
                    id="employee-id"
                    placeholder="Enter your student ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
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
        {isConnected && employeeId && (
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
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="sarah-johnson" id="sarah-johnson" />
                      <Label htmlFor="sarah-johnson" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">Sarah Johnson</p>
                          <p className="text-sm text-gray-600">Academic Excellence & Student Welfare</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="michael-chen" id="michael-chen" />
                      <Label htmlFor="michael-chen" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">Michael Chen</p>
                          <p className="text-sm text-gray-600">Innovation & Technology Integration</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="alexandra-davis" id="alexandra-davis" />
                      <Label htmlFor="alexandra-davis" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">Alexandra Davis</p>
                          <p className="text-sm text-gray-600">Sustainability & Campus Environment</p>
                        </div>
                      </Label>
                    </div>
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
                disabled={!selectedCandidate}
                className="w-full"
                size="lg"
              >
                Submit Vote to Blockchain
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Voter;
