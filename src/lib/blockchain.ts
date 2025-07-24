// Blockchain integration utilities
import { ethers } from 'ethers';

// Voting contract ABI (from Voting-abi.json)
const VOTING_CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "sessionId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "candidateId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "sessionId", "type": "bytes32" },
      { "internalType": "uint256", "name": "candidateId", "type": "uint256" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "sessionId", "type": "bytes32" },
      { "internalType": "uint256", "name": "candidateId", "type": "uint256" }
    ],
    "name": "getVoteCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "sessionId", "type": "bytes32" },
      { "internalType": "address", "name": "voter", "type": "address" }
    ],
    "name": "hasVoted",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Deployed Voting contract address on Sepolia
const VOTING_CONTRACT_ADDRESS = "0xC27C0Fd868Bb3E4434cd3F902729f9e3dD85695d";

export interface BlockchainVote {
  sessionId: string;
  candidateId: string;
  voterAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;

  async connectWallet(): Promise<{ address: string; success: boolean; error?: string }> {
    // Robust MetaMask detection
    function isMetaMaskInstalled() {
      return typeof window !== 'undefined' && !!(window as any).ethereum && (window as any).ethereum.isMetaMask;
    }
    if (!isMetaMaskInstalled()) {
      // Try again after a short delay in case of late injection
      await new Promise(res => setTimeout(res, 500));
      if (!isMetaMaskInstalled()) {
        return {
          address: '',
          success: false,
          error: 'MetaMask is not detected. Please ensure MetaMask is installed and enabled, then refresh the page. If you just installed it, close and reopen your browser.'
        };
      }
    }
    try {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      // Check if MetaMask is on Sepolia
      const network = await this.provider.getNetwork();
      if (network.chainId !== 11155111n) {
        // Prompt user to switch to Sepolia
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xAA36A7' }], // 11155111 in hex
        });
      }

      this.contract = new ethers.Contract(
        VOTING_CONTRACT_ADDRESS,
        VOTING_CONTRACT_ABI,
        this.signer
      );

      return { address, success: true };
    } catch (error: any) {
      return { address: '', success: false, error: error.message };
    }
  }

  async castVote(sessionId: string, candidateId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      const candidateIdNum = parseInt(candidateId);
      if (isNaN(candidateIdNum)) {
        throw new Error('Invalid candidate selected');
      }
      const sessionIdBytes = ethers.id(sessionId);
      const tx = await this.contract.castVote(sessionIdBytes, candidateIdNum);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async hasVoted(sessionId: string, voterAddress: string): Promise<boolean> {
    try {
      // Check database for existing votes with this wallet address and session
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('voting_session_id', sessionId)
        .eq('voter_wallet_address', voterAddress)
        .maybeSingle();
      
      return !!data;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  async getVoteCount(sessionId: string, candidateId: string): Promise<number> {
    try {
      if (!this.contract) return 0;
      
      const sessionIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(sessionId));
      const count = await this.contract.getVoteCount(sessionIdBytes32, parseInt(candidateId));
      return parseInt(count.toString());
    } catch (error) {
      console.error('Error getting vote count:', error);
      return 0;
    }
  }

  get isConnected(): boolean {
    return !!this.contract;
  }

  generateMockTxHash(): string {
    return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

export const blockchainService = new BlockchainService();