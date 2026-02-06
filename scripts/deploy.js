/**
 * DecentraTrust AI - Deployment Script
 * =====================================
 * 
 * Deploys all contracts in the correct order with proper dependencies.
 * 
 * Deployment Order:
 * 1. OracleMock (predicts Reputation oracle address)
 * 2. Reputation (with OracleMock as oracle)
 * 3. PolicyEngine (with Reputation address)
 * 4. Identity (standalone)
 */

const hre = require("hardhat");

async function main() {
    console.log("═══════════════════════════════════════════");
    console.log("   DecentraTrust AI - Contract Deployment   ");
    console.log("═══════════════════════════════════════════\n");

    const [deployer] = await hre.ethers.getSigners();

    console.log("📍 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Step 1: Deploy Identity (standalone)
    console.log("1️⃣ Deploying Identity contract...");
    const Identity = await hre.ethers.getContractFactory("Identity");
    const identity = await Identity.deploy();
    await identity.waitForDeployment();
    const identityAddress = await identity.getAddress();
    console.log("   ✅ Identity deployed to:", identityAddress);

    // Step 2: Calculate OracleMock address for Reputation constructor
    // We need to deploy Reputation with OracleMock as oracle
    // But OracleMock needs Reputation address
    // Solution: Deploy Reputation first with deployer as temp oracle, then deploy OracleMock
    // For simplicity, we use deployer as oracle first, then set OracleMock

    // Actually, better approach: We'll deploy OracleMock expecting Reputation address
    // by computing the CREATE address

    // Step 2: Deploy Reputation with a computed OracleMock address
    console.log("\n2️⃣ Deploying Reputation contract...");

    // Get deployer nonce to predict OracleMock address
    const nonce = await hre.ethers.provider.getTransactionCount(deployer.address);
    // Reputation will be deployed now (nonce)
    // OracleMock will be deployed next (nonce + 1)
    const expectedOracleAddress = hre.ethers.getCreateAddress({
        from: deployer.address,
        nonce: nonce + 1
    });
    console.log("   📊 Expected OracleMock address:", expectedOracleAddress);

    const Reputation = await hre.ethers.getContractFactory("Reputation");
    const reputation = await Reputation.deploy(expectedOracleAddress);
    await reputation.waitForDeployment();
    const reputationAddress = await reputation.getAddress();
    console.log("   ✅ Reputation deployed to:", reputationAddress);

    // Step 3: Deploy OracleMock
    console.log("\n3️⃣ Deploying OracleMock contract...");
    const OracleMock = await hre.ethers.getContractFactory("OracleMock");
    const oracleMock = await OracleMock.deploy(reputationAddress);
    await oracleMock.waitForDeployment();
    const oracleMockAddress = await oracleMock.getAddress();
    console.log("   ✅ OracleMock deployed to:", oracleMockAddress);

    // Verify OracleMock address matches expected
    if (oracleMockAddress.toLowerCase() !== expectedOracleAddress.toLowerCase()) {
        console.log("   ⚠️ Warning: OracleMock address mismatch!");
        console.log("   Expected:", expectedOracleAddress);
        console.log("   Actual:", oracleMockAddress);
    } else {
        console.log("   ✓ OracleMock address matches expected");
    }

    // Step 4: Deploy PolicyEngine
    console.log("\n4️⃣ Deploying PolicyEngine contract...");
    const PolicyEngine = await hre.ethers.getContractFactory("PolicyEngine");
    const policyEngine = await PolicyEngine.deploy(reputationAddress);
    await policyEngine.waitForDeployment();
    const policyEngineAddress = await policyEngine.getAddress();
    console.log("   ✅ PolicyEngine deployed to:", policyEngineAddress);

    // Summary
    console.log("\n═══════════════════════════════════════════");
    console.log("            Deployment Summary              ");
    console.log("═══════════════════════════════════════════");
    console.log("Identity:      ", identityAddress);
    console.log("Reputation:    ", reputationAddress);
    console.log("OracleMock:    ", oracleMockAddress);
    console.log("PolicyEngine:  ", policyEngineAddress);
    console.log("═══════════════════════════════════════════\n");

    // Return addresses for use in other scripts
    return {
        identity: identityAddress,
        reputation: reputationAddress,
        oracleMock: oracleMockAddress,
        policyEngine: policyEngineAddress
    };
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
