import React from 'react';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VoteVerificationProps {
  transactionHash: string;
  sessionTitle: string;
  candidateName?: string;
  timestamp: string;
}

const VoteVerification: React.FC<VoteVerificationProps> = ({
  transactionHash,
  sessionTitle,
  candidateName,
  timestamp
}) => {
  const openBlockExplorer = () => {
    window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank');
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <CardTitle className="text-green-900">Vote Verified on Blockchain</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-green-700 font-medium">Session:</p>
            <p className="text-green-600">{sessionTitle}</p>
          </div>
          {candidateName && (
            <div>
              <p className="text-green-700 font-medium">Candidate:</p>
              <p className="text-green-600">{candidateName}</p>
            </div>
          )}
          <div>
            <p className="text-green-700 font-medium">Timestamp:</p>
            <p className="text-green-600">{new Date(timestamp).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-green-700 font-medium">Status:</p>
            <Badge className="bg-green-100 text-green-700">Confirmed</Badge>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <p className="text-green-700 font-medium text-sm mb-1">Transaction Hash:</p>
          <p className="text-green-600 font-mono text-xs break-all">{transactionHash}</p>
        </div>
        
        <Button onClick={openBlockExplorer} className="w-full" variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Blockchain Explorer
        </Button>
        
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Blockchain Verification</p>
              <p>Your vote has been permanently recorded on the blockchain and cannot be altered or deleted. This ensures complete transparency and integrity of the voting process.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoteVerification;