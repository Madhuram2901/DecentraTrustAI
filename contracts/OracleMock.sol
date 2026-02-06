// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Reputation.sol";

/**
 * @title OracleMock
 * @author DecentraTrust AI
 * @notice Simulates AI → blockchain communication for score updates
 * @dev This contract acts as the oracle for the Reputation contract.
 *      In production, this would be replaced by a secure oracle service (e.g., Chainlink).
 * 
 * LOCKED INTERFACE - DO NOT MODIFY:
 * - pushScore(address user, uint8 score) external
 * 
 * IMPORTANT: This mock is for development/testing only.
 * The interface MUST NOT change to ensure compatibility with future oracle implementations.
 */
contract OracleMock {
    
    // ============ State Variables ============
    
    /// @notice Reference to the Reputation contract
    Reputation public immutable reputation;
    
    /// @notice Address of the contract owner/operator
    address public owner;
    
    /// @notice Mapping to track authorized operators (for future multi-sig support)
    mapping(address => bool) public operators;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a score is pushed to the blockchain
     * @param user The user whose score was updated
     * @param score The new score pushed
     * @param timestamp The block timestamp
     */
    event ScorePushed(
        address indexed user,
        uint8 score,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when an operator is added or removed
     * @param operator The operator address
     * @param authorized Whether the operator is now authorized
     */
    event OperatorUpdated(
        address indexed operator,
        bool authorized
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when a non-owner tries to perform owner-only actions
    error OnlyOwner(address caller);
    
    /// @notice Thrown when a non-operator tries to push scores
    error OnlyOperator(address caller);
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the OracleMock with the Reputation contract address
     * @dev Sets the deployer as owner and initial operator
     * @param _reputation The address of the Reputation contract
     */
    constructor(address _reputation) {
        require(_reputation != address(0), "Reputation cannot be zero address");
        reputation = Reputation(_reputation);
        owner = msg.sender;
        operators[msg.sender] = true;
    }
    
    // ============ Modifiers ============
    
    /**
     * @notice Restricts function access to the owner only
     */
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert OnlyOwner(msg.sender);
        }
        _;
    }
    
    /**
     * @notice Restricts function access to authorized operators
     */
    modifier onlyOperator() {
        if (!operators[msg.sender]) {
            revert OnlyOperator(msg.sender);
        }
        _;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Push a trust score for a user to the blockchain
     * @dev This is the main interface for AI → blockchain communication.
     *      Only authorized operators can call this function.
     * @param user The address to update
     * @param score The new trust score (0-100)
     * 
     * Requirements:
     * - Caller must be an authorized operator
     * - Score must be 0-100 (enforced by Reputation contract)
     * 
     * Emits a {ScorePushed} event.
     */
    function pushScore(address user, uint8 score) external onlyOperator {
        // Push the score to the Reputation contract
        reputation.updateScore(user, score);
        
        // Emit local event for tracking
        emit ScorePushed(user, score, block.timestamp);
    }
    
    /**
     * @notice Push scores for multiple users in a single transaction
     * @dev Gas-efficient batch update for multiple users
     * @param users Array of addresses to update
     * @param scores Array of scores corresponding to each user
     */
    function pushScoreBatch(
        address[] calldata users,
        uint8[] calldata scores
    ) external onlyOperator {
        require(users.length == scores.length, "Arrays length mismatch");
        require(users.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < users.length; i++) {
            reputation.updateScore(users[i], scores[i]);
            emit ScorePushed(users[i], scores[i], block.timestamp);
        }
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Add or remove an operator
     * @param operator The address to update
     * @param authorized Whether the address should be authorized
     */
    function setOperator(address operator, bool authorized) external onlyOwner {
        operators[operator] = authorized;
        emit OperatorUpdated(operator, authorized);
    }
    
    /**
     * @notice Transfer ownership to a new address
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
