// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Reputation
 * @author DecentraTrust AI
 * @notice Manages trust scores for users in the DecentraTrust AI system
 * @dev Only the designated oracle can update scores. Scores are in range 0-100.
 * 
 * LOCKED INTERFACE - DO NOT MODIFY:
 * - getScore(address user) external view returns (uint8)
 * - updateScore(address user, uint8 newScore) external
 */
contract Reputation {
    
    // ============ State Variables ============
    
    /// @notice The oracle address that is authorized to update scores
    address public immutable oracle;
    
    /// @notice Mapping from user address to their trust score (0-100)
    mapping(address => uint8) private scores;
    
    /// @notice Mapping from user address to last update timestamp
    mapping(address => uint256) private lastUpdated;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a user's score is updated
     * @param user The user whose score was updated
     * @param oldScore The previous score
     * @param newScore The new score
     * @param timestamp The block timestamp of the update
     */
    event ScoreUpdated(
        address indexed user,
        uint8 oldScore,
        uint8 newScore,
        uint256 timestamp
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when a non-oracle address tries to update a score
    error OnlyOracleCanUpdate(address caller, address oracle);
    
    /// @notice Thrown when the score is outside the valid range (0-100)
    error ScoreOutOfRange(uint8 score);
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the Reputation contract with the oracle address
     * @dev The oracle address is set once and cannot be changed (immutable)
     * @param _oracle The address of the oracle that will push scores
     */
    constructor(address _oracle) {
        require(_oracle != address(0), "Oracle cannot be zero address");
        oracle = _oracle;
    }
    
    // ============ Modifiers ============
    
    /**
     * @notice Restricts function access to the oracle only
     */
    modifier onlyOracle() {
        if (msg.sender != oracle) {
            revert OnlyOracleCanUpdate(msg.sender, oracle);
        }
        _;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Get the trust score for a user
     * @dev Returns 0 if the user has no score set
     * @param user The address to query
     * @return The user's trust score (0-100)
     */
    function getScore(address user) external view returns (uint8) {
        return scores[user];
    }
    
    /**
     * @notice Update the trust score for a user
     * @dev Only callable by the oracle. Score must be 0-100.
     * @param user The address to update
     * @param newScore The new trust score (0-100)
     * 
     * Requirements:
     * - Caller must be the oracle
     * - newScore must be <= 100
     * 
     * Emits a {ScoreUpdated} event.
     */
    function updateScore(address user, uint8 newScore) external onlyOracle {
        // Validate score range
        if (newScore > 100) {
            revert ScoreOutOfRange(newScore);
        }
        
        // Get old score for event
        uint8 oldScore = scores[user];
        
        // Update score and timestamp
        scores[user] = newScore;
        lastUpdated[user] = block.timestamp;
        
        // Emit event
        emit ScoreUpdated(user, oldScore, newScore, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get the timestamp of the last score update for a user
     * @param user The address to query
     * @return The Unix timestamp of the last update (0 if never updated)
     */
    function getLastUpdated(address user) external view returns (uint256) {
        return lastUpdated[user];
    }
    
    /**
     * @notice Check if a user has ever been scored
     * @param user The address to check
     * @return True if the user has been scored at least once
     */
    function hasScore(address user) external view returns (bool) {
        return lastUpdated[user] > 0;
    }
}
