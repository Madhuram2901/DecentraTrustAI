"""
DecentraTrust AI - Oracle Listener
==================================

Connects to the blockchain and listens for events.
Provides Web3 integration for the backend API.

This module:
1. Connects to the Ethereum network (local Hardhat or testnet)
2. Interfaces with the OracleMock contract
3. Pushes scores from the AI engine to the blockchain
"""

import os
import json
from typing import Optional
from web3 import Web3
from web3.exceptions import ContractLogicError


class OracleListener:
    """
    Manages blockchain connection and oracle interactions.
    """
    
    def __init__(
        self,
        rpc_url: str = "http://127.0.0.1:8545",
        oracle_address: Optional[str] = None,
        private_key: Optional[str] = None
    ):
        """
        Initialize the Oracle Listener.
        
        Args:
            rpc_url: Ethereum RPC endpoint URL
            oracle_address: Deployed OracleMock contract address
            private_key: Private key for signing transactions
        """
        self.rpc_url = rpc_url
        self.oracle_address = oracle_address
        self.private_key = private_key
        self.w3: Optional[Web3] = None
        self.oracle_contract = None
        self.account = None
        
    def connect(self) -> bool:
        """
        Connect to the Ethereum network.
        
        Returns:
            bool: True if connection successful
        """
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            
            if not self.w3.is_connected():
                print(f"❌ Failed to connect to {self.rpc_url}")
                return False
            
            print(f"✅ Connected to Ethereum network at {self.rpc_url}")
            print(f"   Chain ID: {self.w3.eth.chain_id}")
            print(f"   Block Number: {self.w3.eth.block_number}")
            
            # Set up account if private key provided
            if self.private_key:
                self.account = self.w3.eth.account.from_key(self.private_key)
                print(f"   Account: {self.account.address}")
            
            return True
            
        except Exception as e:
            print(f"❌ Connection error: {str(e)}")
            return False
    
    def load_contract(self, abi_path: str) -> bool:
        """
        Load the OracleMock contract.
        
        Args:
            abi_path: Path to the contract ABI JSON file
            
        Returns:
            bool: True if contract loaded successfully
        """
        if not self.w3 or not self.oracle_address:
            print("❌ Web3 not connected or oracle address not set")
            return False
        
        try:
            with open(abi_path, 'r') as f:
                contract_json = json.load(f)
                abi = contract_json.get('abi', contract_json)
            
            self.oracle_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.oracle_address),
                abi=abi
            )
            
            print(f"✅ OracleMock contract loaded at {self.oracle_address}")
            return True
            
        except Exception as e:
            print(f"❌ Contract loading error: {str(e)}")
            return False
    
    def push_score(self, user_address: str, score: int) -> Optional[str]:
        """
        Push a trust score to the blockchain.
        
        Args:
            user_address: The user's wallet address
            score: Trust score (0-100)
            
        Returns:
            Optional[str]: Transaction hash if successful, None otherwise
        """
        if not self.oracle_contract or not self.account:
            print("❌ Contract or account not configured")
            return None
        
        try:
            # Validate inputs
            if not 0 <= score <= 100:
                print(f"❌ Invalid score: {score}")
                return None
            
            user_address = Web3.to_checksum_address(user_address)
            
            # Build transaction
            tx = self.oracle_contract.functions.pushScore(
                user_address,
                score
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                print(f"✅ Score pushed: {user_address} -> {score}")
                print(f"   TX Hash: {tx_hash.hex()}")
                return tx_hash.hex()
            else:
                print(f"❌ Transaction failed: {tx_hash.hex()}")
                return None
                
        except ContractLogicError as e:
            print(f"❌ Contract error: {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Push error: {str(e)}")
            return None
    
    def get_score(self, user_address: str) -> Optional[int]:
        """
        Get a user's current score from the blockchain.
        
        Args:
            user_address: The user's wallet address
            
        Returns:
            Optional[int]: The user's score, or None if error
        """
        if not self.oracle_contract:
            return None
        
        try:
            user_address = Web3.to_checksum_address(user_address)
            reputation_address = self.oracle_contract.functions.reputation().call()
            
            # Load Reputation contract to get score
            # For now, return None - full implementation requires Reputation ABI
            return None
            
        except Exception as e:
            print(f"❌ Get score error: {str(e)}")
            return None


# ============ Standalone Listener Mode ============

def run_listener():
    """
    Run the oracle listener in standalone mode.
    Useful for testing and development.
    """
    print("=" * 50)
    print("DecentraTrust AI - Oracle Listener")
    print("=" * 50)
    
    # Configuration from environment
    rpc_url = os.environ.get("RPC_URL", "http://127.0.0.1:8545")
    oracle_address = os.environ.get("ORACLE_ADDRESS")
    private_key = os.environ.get("PRIVATE_KEY")
    
    if not oracle_address:
        print("⚠️ ORACLE_ADDRESS not set - running in observation mode")
    
    # Create listener
    listener = OracleListener(
        rpc_url=rpc_url,
        oracle_address=oracle_address,
        private_key=private_key
    )
    
    # Try to connect
    if listener.connect():
        print("\n📡 Listening for events...")
        print("   Press Ctrl+C to stop\n")
        
        try:
            # Keep running
            import time
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n👋 Stopping listener...")
    else:
        print("❌ Failed to start listener")


if __name__ == "__main__":
    run_listener()
