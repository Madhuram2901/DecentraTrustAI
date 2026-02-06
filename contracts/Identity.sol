// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Identity
 * @author DecentraTrust AI
 * @notice Manages decentralized identity registration for users
 * @dev Each wallet can register one identity with IPFS metadata hash
 * 
 * LOCKED INTERFACE - DO NOT MODIFY:
 * - registerIdentity(string calldata metadataHash) external
 * - getIdentity(address user) external view returns (address, string memory, bool)
 */
contract Identity {
    
    // ============ Structs ============
    
    /**
     * @notice Represents a user's identity
     * @param wallet The wallet address that owns this identity
     * @param metadataHash IPFS hash containing identity metadata
     * @param isRegistered Whether the identity is registered
     */
    struct UserIdentity {
        address wallet;
        string metadataHash;
        bool isRegistered;
    }
    
    // ============ State Variables ============
    
    /// @notice Mapping from wallet address to their identity
    mapping(address => UserIdentity) private identities;
    
    /// @notice Total number of registered identities
    uint256 public totalIdentities;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a new identity is registered
     * @param user The wallet address that registered
     * @param metadataHash The IPFS hash of the identity metadata
     * @param timestamp The block timestamp of registration
     */
    event IdentityRegistered(
        address indexed user,
        string metadataHash,
        uint256 timestamp
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when a user tries to register but already has an identity
    error IdentityAlreadyExists(address user);
    
    /// @notice Thrown when an empty metadata hash is provided
    error EmptyMetadataHash();
    
    // ============ External Functions ============
    
    /**
     * @notice Register a new identity for the caller
     * @dev Each wallet can only register once. Reverts on duplicate registration.
     * @param metadataHash IPFS hash containing identity metadata (e.g., "QmXxx...")
     * 
     * Requirements:
     * - Caller must not have an existing identity
     * - metadataHash must not be empty
     * 
     * Emits an {IdentityRegistered} event.
     */
    function registerIdentity(string calldata metadataHash) external {
        // Check if user already has an identity
        if (identities[msg.sender].isRegistered) {
            revert IdentityAlreadyExists(msg.sender);
        }
        
        // Check if metadata hash is not empty
        if (bytes(metadataHash).length == 0) {
            revert EmptyMetadataHash();
        }
        
        // Register the new identity
        identities[msg.sender] = UserIdentity({
            wallet: msg.sender,
            metadataHash: metadataHash,
            isRegistered: true
        });
        
        // Increment total identities counter
        totalIdentities++;
        
        // Emit registration event
        emit IdentityRegistered(msg.sender, metadataHash, block.timestamp);
    }
    
    /**
     * @notice Get the identity information for a specific user
     * @dev Returns default values if user has no registered identity
     * @param user The wallet address to query
     * @return wallet The wallet address (address(0) if not registered)
     * @return metadataHash The IPFS metadata hash (empty string if not registered)
     * @return isRegistered Whether the user has a registered identity
     */
    function getIdentity(address user) external view returns (
        address wallet,
        string memory metadataHash,
        bool isRegistered
    ) {
        UserIdentity storage identity = identities[user];
        return (identity.wallet, identity.metadataHash, identity.isRegistered);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Check if a user has a registered identity
     * @param user The wallet address to check
     * @return bool True if the user has a registered identity
     */
    function hasIdentity(address user) external view returns (bool) {
        return identities[user].isRegistered;
    }
}
