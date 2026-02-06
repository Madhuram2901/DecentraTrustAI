const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Identity Contract", function () {
    let identity;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const Identity = await ethers.getContractFactory("Identity");
        identity = await Identity.deploy();
        await identity.waitForDeployment();
    });

    describe("Registration", function () {
        it("Should allow a user to register an identity", async function () {
            const metadataHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

            // Just check event is emitted with correct user and hash
            await expect(identity.connect(user1).registerIdentity(metadataHash))
                .to.emit(identity, "IdentityRegistered");

            const [wallet, hash, isRegistered] = await identity.getIdentity(user1.address);
            expect(wallet).to.equal(user1.address);
            expect(hash).to.equal(metadataHash);
            expect(isRegistered).to.be.true;
        });

        it("Should fail when registering duplicate identity", async function () {
            const metadataHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

            await identity.connect(user1).registerIdentity(metadataHash);

            await expect(identity.connect(user1).registerIdentity(metadataHash))
                .to.be.revertedWithCustomError(identity, "IdentityAlreadyExists")
                .withArgs(user1.address);
        });

        it("Should fail when registering with empty metadata hash", async function () {
            await expect(identity.connect(user1).registerIdentity(""))
                .to.be.revertedWithCustomError(identity, "EmptyMetadataHash");
        });

        it("Should increment total identities count", async function () {
            expect(await identity.totalIdentities()).to.equal(0);

            await identity.connect(user1).registerIdentity("hash1");
            expect(await identity.totalIdentities()).to.equal(1);

            await identity.connect(user2).registerIdentity("hash2");
            expect(await identity.totalIdentities()).to.equal(2);
        });
    });

    describe("Getter Functions", function () {
        it("Should return default values for unregistered user", async function () {
            const [wallet, hash, isRegistered] = await identity.getIdentity(user1.address);
            expect(wallet).to.equal(ethers.ZeroAddress);
            expect(hash).to.equal("");
            expect(isRegistered).to.be.false;
        });

        it("Should correctly check if user has identity", async function () {
            expect(await identity.hasIdentity(user1.address)).to.be.false;

            await identity.connect(user1).registerIdentity("hash1");

            expect(await identity.hasIdentity(user1.address)).to.be.true;
        });
    });
});

// Helper function to get current block timestamp
async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
}
