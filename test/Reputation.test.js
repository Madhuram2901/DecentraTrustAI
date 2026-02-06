const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reputation Contract", function () {
    let reputation;
    let oracle;
    let user1;
    let user2;
    let nonOracle;

    beforeEach(async function () {
        [oracle, user1, user2, nonOracle] = await ethers.getSigners();

        const Reputation = await ethers.getContractFactory("Reputation");
        reputation = await Reputation.deploy(oracle.address);
        await reputation.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the oracle address correctly", async function () {
            expect(await reputation.oracle()).to.equal(oracle.address);
        });

        it("Should fail to deploy with zero address oracle", async function () {
            const Reputation = await ethers.getContractFactory("Reputation");
            await expect(Reputation.deploy(ethers.ZeroAddress))
                .to.be.revertedWith("Oracle cannot be zero address");
        });
    });

    describe("Score Updates", function () {
        it("Should allow oracle to update score", async function () {
            await expect(reputation.connect(oracle).updateScore(user1.address, 85))
                .to.emit(reputation, "ScoreUpdated");

            expect(await reputation.getScore(user1.address)).to.equal(85);
        });

        it("Should reject non-oracle score updates", async function () {
            await expect(reputation.connect(nonOracle).updateScore(user1.address, 85))
                .to.be.revertedWithCustomError(reputation, "OnlyOracleCanUpdate")
                .withArgs(nonOracle.address, oracle.address);
        });

        it("Should reject score above 100", async function () {
            await expect(reputation.connect(oracle).updateScore(user1.address, 101))
                .to.be.revertedWithCustomError(reputation, "ScoreOutOfRange")
                .withArgs(101);
        });

        it("Should accept score of exactly 100", async function () {
            await reputation.connect(oracle).updateScore(user1.address, 100);
            expect(await reputation.getScore(user1.address)).to.equal(100);
        });

        it("Should accept score of 0", async function () {
            await reputation.connect(oracle).updateScore(user1.address, 0);
            expect(await reputation.getScore(user1.address)).to.equal(0);
        });

        it("Should update timestamp on score change", async function () {
            expect(await reputation.getLastUpdated(user1.address)).to.equal(0);

            await reputation.connect(oracle).updateScore(user1.address, 50);

            expect(await reputation.getLastUpdated(user1.address)).to.be.gt(0);
        });
    });

    describe("Score Queries", function () {
        it("Should return 0 for users without score", async function () {
            expect(await reputation.getScore(user1.address)).to.equal(0);
        });

        it("Should correctly report if user has score", async function () {
            expect(await reputation.hasScore(user1.address)).to.be.false;

            await reputation.connect(oracle).updateScore(user1.address, 50);

            expect(await reputation.hasScore(user1.address)).to.be.true;
        });
    });
});

// Helper function to get current block timestamp
async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
}
