// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Reputation.sol";

/**
 * @title PolicyEngine
 * @author DecentraTrust AI
 * @notice Determines access tiers based on user reputation scores
 * @dev Read-only contract that queries Reputation contract for scoring decisions
 * 
 * LOCKED INTERFACE - DO NOT MODIFY:
 * - canPerformAction(address user) external view returns (bool)
 * - getUserTier(address user) external view returns (uint8)
 * 
 * TIER LOGIC (LOCKED):
 * - Score >= 80: FULL (Tier 2)
 * - Score 50-79: LIMITED (Tier 1)
 * - Score < 50: BLOCKED (Tier 0)
 */
contract PolicyEngine {
    
    // ============ Constants ============
    
    /// @notice Tier level for blocked users (score < 50)
    uint8 public constant TIER_BLOCKED = 0;
    
    /// @notice Tier level for limited access (score 50-79)
    uint8 public constant TIER_LIMITED = 1;
    
    /// @notice Tier level for full access (score >= 80)
    uint8 public constant TIER_FULL = 2;
    
    /// @notice Minimum score required for LIMITED tier
    uint8 public constant THRESHOLD_LIMITED = 50;
    
    /// @notice Minimum score required for FULL tier
    uint8 public constant THRESHOLD_FULL = 80;
    
    // ============ State Variables ============
    
    /// @notice Reference to the Reputation contract
    Reputation public immutable reputation;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when an access check is performed
     * @param user The user whose access was checked
     * @param tier The tier level determined
     * @param canPerform Whether the user can perform actions
     */
    event AccessChecked(
        address indexed user,
        uint8 tier,
        bool canPerform
    );
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the PolicyEngine with the Reputation contract address
     * @param _reputation The address of the Reputation contract
     */
    constructor(address _reputation) {
        require(_reputation != address(0), "Reputation cannot be zero address");
        reputation = Reputation(_reputation);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Check if a user can perform protected actions
     * @dev Returns true only for users with LIMITED or FULL tier (score >= 50)
     * @param user The address to check
     * @return True if the user can perform actions (not BLOCKED)
     */
    function canPerformAction(address user) external view returns (bool) {
        uint8 score = reputation.getScore(user);
        return score >= THRESHOLD_LIMITED;
    }
    
    /**
     * @notice Get the access tier for a user based on their reputation score
     * @dev Tier Logic:
     *      - Score >= 80: FULL (2)
     *      - Score 50-79: LIMITED (1)
     *      - Score < 50: BLOCKED (0)
     * @param user The address to query
     * @return The user's tier level (0 = BLOCKED, 1 = LIMITED, 2 = FULL)
     */
    function getUserTier(address user) external view returns (uint8) {
        uint8 score = reputation.getScore(user);
        
        if (score >= THRESHOLD_FULL) {
            return TIER_FULL;
        } else if (score >= THRESHOLD_LIMITED) {
            return TIER_LIMITED;
        } else {
            return TIER_BLOCKED;
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get detailed access information for a user
     * @param user The address to query
     * @return score The user's current reputation score
     * @return tier The user's access tier
     * @return canPerform Whether the user can perform actions
     */
    function getAccessInfo(address user) external view returns (
        uint8 score,
        uint8 tier,
        bool canPerform
    ) {
        score = reputation.getScore(user);
        
        if (score >= THRESHOLD_FULL) {
            tier = TIER_FULL;
        } else if (score >= THRESHOLD_LIMITED) {
            tier = TIER_LIMITED;
        } else {
            tier = TIER_BLOCKED;
        }
        
        canPerform = score >= THRESHOLD_LIMITED;
    }
    
    /**
     * @notice Get the tier name as a string for display purposes
     * @param user The address to query
     * @return The tier name ("FULL", "LIMITED", or "BLOCKED")
     */
    function getTierName(address user) external view returns (string memory) {
        uint8 score = reputation.getScore(user);
        
        if (score >= THRESHOLD_FULL) {
            return "FULL";
        } else if (score >= THRESHOLD_LIMITED) {
            return "LIMITED";
        } else {
            return "BLOCKED";
        }
    }
}
