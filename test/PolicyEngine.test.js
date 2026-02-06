const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolicyEngine Contract", function () {
    let reputation;
    let policyEngine;
    let oracle;
    let user1;
    let user2;
    let user3;

    beforeEach(async function () {
        [oracle, user1, user2, user3] = await ethers.getSigners();

        // Deploy Reputation contract with oracle
        const Reputation = await ethers.getContractFactory("Reputation");
        reputation = await Reputation.deploy(oracle.address);
        await reputation.waitForDeployment();

        // Deploy PolicyEngine with Reputation address
        const PolicyEngine = await ethers.getContractFactory("PolicyEngine");
        policyEngine = await PolicyEngine.deploy(await reputation.getAddress());
        await policyEngine.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the reputation contract correctly", async function () {
            expect(await policyEngine.reputation()).to.equal(await reputation.getAddress());
        });

        it("Should fail to deploy with zero address", async function () {
            const PolicyEngine = await ethers.getContractFactory("PolicyEngine");
            await expect(PolicyEngine.deploy(ethers.ZeroAddress))
                .to.be.revertedWith("Reputation cannot be zero address");
        });
    });

    describe("Tier Logic", function () {
        it("Should return BLOCKED tier for score < 50", async function () {
            await reputation.connect(oracle).updateScore(user1.address, 49);

            expect(await policyEngine.getUserTier(user1.address)).to.equal(0); // BLOCKED
            expect(await policyEngine.canPerformAction(user1.address)).to.be.false;
            expect(await policyEngine.getTierName(user1.address)).to.equal("BLOCKED");
        });

        it("Should return LIMITED tier for score 50-79", async function () {
            await reputation.connect(oracle).updateScore(user1.address, 50);
            expect(await policyEngine.getUserTier(user1.address)).to.equal(1); // LIMITED
            expect(await policyEngine.canPerformAction(user1.address)).to.be.true;
            expect(await policyEngine.getTierName(user1.address)).to.equal("LIMITED");

            await reputation.connect(oracle).updateScore(user2.address, 79);
            expect(await policyEngine.getUserTier(user2.address)).to.equal(1); // LIMITED
            expect(await policyEngine.canPerformAction(user2.address)).to.be.true;
        });

        it("Should return FULL tier for score >= 80", async function () {
            await reputation.connect(oracle).updateScore(user1.address, 80);
            expect(await policyEngine.getUserTier(user1.address)).to.equal(2); // FULL
            expect(await policyEngine.canPerformAction(user1.address)).to.be.true;
            expect(await policyEngine.getTierName(user1.address)).to.equal("FULL");

            await reputation.connect(oracle).updateScore(user2.address, 100);
            expect(await policyEngine.getUserTier(user2.address)).to.equal(2); // FULL
        });

        it("Should return BLOCKED for users with no score (default 0)", async function () {
            expect(await policyEngine.getUserTier(user1.address)).to.equal(0); // BLOCKED
            expect(await policyEngine.canPerformAction(user1.address)).to.be.false;
        });
    });

    describe("Access Info", function () {
        it("Should return complete access info", async function () {
            await reputation.connect(oracle).updateScore(user1.address, 85);

            const [score, tier, canPerform] = await policyEngine.getAccessInfo(user1.address);

            expect(score).to.equal(85);
            expect(tier).to.equal(2); // FULL
            expect(canPerform).to.be.true;
        });
    });

    describe("Tier Thresholds", function () {
        it("Should have correct threshold constants", async function () {
            expect(await policyEngine.TIER_BLOCKED()).to.equal(0);
            expect(await policyEngine.TIER_LIMITED()).to.equal(1);
            expect(await policyEngine.TIER_FULL()).to.equal(2);
            expect(await policyEngine.THRESHOLD_LIMITED()).to.equal(50);
            expect(await policyEngine.THRESHOLD_FULL()).to.equal(80);
        });
    });
});
