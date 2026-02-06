const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OracleMock Contract", function () {
    let reputation;
    let oracleMock;
    let owner;
    let operator;
    let user1;
    let user2;
    let nonOperator;

    beforeEach(async function () {
        [owner, operator, user1, user2, nonOperator] = await ethers.getSigners();

        // Deploy OracleMock first (we need its address for Reputation)
        // Actually, Reputation needs oracle address, and OracleMock needs Reputation address
        // So we need a two-step deployment

        // Deploy Reputation with a temporary oracle (will be OracleMock)
        const Reputation = await ethers.getContractFactory("Reputation");

        // We need to predict the OracleMock address or deploy Reputation with owner as oracle first
        // For testing, let's deploy Reputation with owner as oracle, then deploy OracleMock
        // In production, you'd use CREATE2 or a factory pattern

        // For this test, we'll deploy Reputation expecting OracleMock as oracle
        // First, compute what the OracleMock address will be
        const nonce = await ethers.provider.getTransactionCount(owner.address);
        const expectedOracleAddress = ethers.getCreateAddress({ from: owner.address, nonce: nonce + 1 });

        reputation = await Reputation.deploy(expectedOracleAddress);
        await reputation.waitForDeployment();

        // Now deploy OracleMock
        const OracleMock = await ethers.getContractFactory("OracleMock");
        oracleMock = await OracleMock.deploy(await reputation.getAddress());
        await oracleMock.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the reputation contract correctly", async function () {
            expect(await oracleMock.reputation()).to.equal(await reputation.getAddress());
        });

        it("Should set owner correctly", async function () {
            expect(await oracleMock.owner()).to.equal(owner.address);
        });

        it("Should set deployer as operator", async function () {
            expect(await oracleMock.operators(owner.address)).to.be.true;
        });
    });

    describe("Push Score", function () {
        it("Should allow operator to push score", async function () {
            await expect(oracleMock.connect(owner).pushScore(user1.address, 75))
                .to.emit(oracleMock, "ScorePushed");

            expect(await reputation.getScore(user1.address)).to.equal(75);
        });

        it("Should reject non-operator push", async function () {
            await expect(oracleMock.connect(nonOperator).pushScore(user1.address, 75))
                .to.be.revertedWithCustomError(oracleMock, "OnlyOperator")
                .withArgs(nonOperator.address);
        });

        it("Should reject score above 100", async function () {
            await expect(oracleMock.connect(owner).pushScore(user1.address, 101))
                .to.be.revertedWithCustomError(reputation, "ScoreOutOfRange");
        });
    });

    describe("Batch Push", function () {
        it("Should push scores for multiple users", async function () {
            const users = [user1.address, user2.address];
            const scores = [80, 60];

            await oracleMock.connect(owner).pushScoreBatch(users, scores);

            expect(await reputation.getScore(user1.address)).to.equal(80);
            expect(await reputation.getScore(user2.address)).to.equal(60);
        });

        it("Should reject mismatched arrays", async function () {
            const users = [user1.address, user2.address];
            const scores = [80];

            await expect(oracleMock.connect(owner).pushScoreBatch(users, scores))
                .to.be.revertedWith("Arrays length mismatch");
        });

        it("Should reject empty arrays", async function () {
            await expect(oracleMock.connect(owner).pushScoreBatch([], []))
                .to.be.revertedWith("Empty arrays");
        });
    });

    describe("Operator Management", function () {
        it("Should allow owner to add operator", async function () {
            await expect(oracleMock.connect(owner).setOperator(operator.address, true))
                .to.emit(oracleMock, "OperatorUpdated")
                .withArgs(operator.address, true);

            expect(await oracleMock.operators(operator.address)).to.be.true;

            // New operator can push scores
            await oracleMock.connect(operator).pushScore(user1.address, 90);
            expect(await reputation.getScore(user1.address)).to.equal(90);
        });

        it("Should allow owner to remove operator", async function () {
            await oracleMock.connect(owner).setOperator(operator.address, true);
            await oracleMock.connect(owner).setOperator(operator.address, false);

            expect(await oracleMock.operators(operator.address)).to.be.false;
        });

        it("Should reject non-owner operator changes", async function () {
            await expect(oracleMock.connect(nonOperator).setOperator(operator.address, true))
                .to.be.revertedWithCustomError(oracleMock, "OnlyOwner");
        });
    });

    describe("Ownership Transfer", function () {
        it("Should allow owner to transfer ownership", async function () {
            await oracleMock.connect(owner).transferOwnership(operator.address);
            expect(await oracleMock.owner()).to.equal(operator.address);
        });

        it("Should reject transfer to zero address", async function () {
            await expect(oracleMock.connect(owner).transferOwnership(ethers.ZeroAddress))
                .to.be.revertedWith("New owner cannot be zero address");
        });
    });
});

// Helper function to get current block timestamp
async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
}
