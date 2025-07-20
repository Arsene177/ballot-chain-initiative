// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    // sessionId => candidateId => vote count
    mapping(bytes32 => mapping(uint256 => uint256)) private voteCounts;
    // sessionId => voter => has voted
    mapping(bytes32 => mapping(address => bool)) private voted;

    event VoteCast(bytes32 indexed sessionId, address indexed voter, uint256 candidateId, uint256 timestamp);

    function castVote(bytes32 sessionId, uint256 candidateId) external {
        require(!voted[sessionId][msg.sender], "Already voted in this session");
        voted[sessionId][msg.sender] = true;
        voteCounts[sessionId][candidateId] += 1;
        emit VoteCast(sessionId, msg.sender, candidateId, block.timestamp);
    }

    function hasVoted(bytes32 sessionId, address voter) external view returns (bool) {
        return voted[sessionId][voter];
    }

    function getVoteCount(bytes32 sessionId, uint256 candidateId) external view returns (uint256) {
        return voteCounts[sessionId][candidateId];
    }
} 