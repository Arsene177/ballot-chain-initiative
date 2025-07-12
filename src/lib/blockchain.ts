// Blockchain integration utilities
import { ethers } from 'ethers';

// Mock contract ABI for voting
const VOTING_CONTRACT_ABI = [
  "function castVote(bytes32 sessionId, uint256 candidateId) external",
  "function hasVoted(bytes32 sessionId, address voter) external view returns (bool)",
  "function getVoteCount(bytes32 sessionId, uint256 candidateId) external view returns (uint256)",
  "event VoteCast(bytes32 indexed sessionId, address indexed voter, uint256 candidateId, uint256 timestamp)"
];

// Mock contract address (replace with actual deployed contract)
const VOTING_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

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
    try {
      if (!window.ethereum) {
        return { address: '', success: false, error: 'MetaMask not installed' };
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
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
      if (!this.contract || !this.signer) {
        throw new Error('Wallet not connected');
      }

      // Convert sessionId to bytes32
      const sessionIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(sessionId));
      
      // Check if user has already voted
      const hasVoted = await this.contract.hasVoted(sessionIdBytes32, await this.signer.getAddress());
      if (hasVoted) {
        return { success: false, error: 'You have already voted in this session' };
      }

      // Cast vote
      const tx = await this.contract.castVote(sessionIdBytes32, parseInt(candidateId));
      const receipt = await tx.wait();

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async hasVoted(sessionId: string, voterAddress: string): Promise<boolean> {
    try {
      if (!this.contract) return false;
      
      const sessionIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(sessionId));
      return await this.contract.hasVoted(sessionIdBytes32, voterAddress);
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

  generateMockTxHash(): string {
    return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

export const blockchainService = new BlockchainService();