import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { daoLockFixture, daoLockTokensPurchasedFixture, daoLockUnlockedFixture } from "./lib/fixtures";
import { accessControlTestFactory, AccessControlSupportedContracts } from "./lib/AccessControl";
import { ethers } from "hardhat";

describe("DAO Lock", function () {
  describe("Deployment", function () {
    it("Deploys", async function () {
      const { lock } = await loadFixture(daoLockFixture);

      expect(await lock.getAddress()).to.be.properAddress;
    });
  });

  describe("DAO Address", function () {
    it("Sets DAO address correctly", async function () {
      const { user, operator, lock, callLockAs, daoMockAddress } = await loadFixture(daoLockFixture);

      await expect(callLockAs(operator).setNeuDaoAddress(daoMockAddress)).to.emit(lock, "AddressChange").withArgs(daoMockAddress);
      expect(await callLockAs(user).neuDaoAddress()).to.equal(daoMockAddress);
    });

    it("Reverts when non-operator sets DAO address", async function () {
      const { user, callLockAs, daoMockAddress } = await loadFixture(daoLockFixture);

      await expect(callLockAs(user).setNeuDaoAddress(daoMockAddress)).to.be.reverted;
    });

    it("Clears key token list when operator changes DAO address", async function () {
      const { user, user2, operator, lock, daoMockAddress, callLockAs } = await loadFixture(daoLockUnlockedFixture);

      const operatorAddress = await operator.getAddress() as `0x${string}`;

      expect(await callLockAs(user).keyTokenIds(0n)).to.equal(1n);

      await expect(callLockAs(operator).setNeuDaoAddress(operatorAddress)).to.emit(lock, "AddressChange").withArgs(operatorAddress);
      await expect(callLockAs(user2).unlock(3n)).to.emit(lock, "Unlock").withArgs(3n);

      expect(await callLockAs(user).keyTokenIds(0n)).to.equal(3n);
      await expect(callLockAs(user).keyTokenIds(1n)).to.be.reverted;
    });
  });

  describe("Unlocking", function () {
    it("Adds a NEU token as a key", async function () {
      const { user, lock, callLockAs } = await loadFixture(daoLockTokensPurchasedFixture);

      await expect(callLockAs(user).unlock(2n)).to.emit(lock, "Unlock").withArgs(2n);
      expect(await callLockAs(user).keyTokenIds(0n)).to.equal(2n);
    });

    it("Reverts when adding NEU token as a key before setting DAO address", async function () {
      const { user, operator, callNeuAs, callLockAs, callMetadataAs, ogId } = await loadFixture(daoLockFixture);

      await (await callNeuAs(operator).safeMint(user.address, ogId)).wait();

      await expect(callLockAs(user).unlock(1n)).to.be.revertedWith("NEU DAO address not set");
    });

    it("Reverts when caller calls unlock not owning the token", async function () {
      const { user, lock, callLockAs } = await loadFixture(daoLockFixture);
      
      await expect(callLockAs(user).unlock(3n)).to.be.reverted;
    });
  });

  describe("Canceling unlock", function () {
    it("Reverts when caller calls unlock with owned non-governance token", async function () {
      const { user, lock, callLockAs } = await loadFixture(daoLockFixture);
      
      await expect(callLockAs(user).unlock(100001n)).to.be.revertedWith("Provided token is not governance");
    });

    it("Reverts when same token is used to unlock twice", async function () {
      const { user, lock, callLockAs } = await loadFixture(daoLockTokensPurchasedFixture);

      await expect(callLockAs(user).unlock(2n)).to.emit(lock, "Unlock").withArgs(2n);
      await expect(callLockAs(user).unlock(2n)).to.be.revertedWith("Token already used as key");
    });

    it("Cancels a NEU token as a key", async function () {
      const { user, user2, lock, callLockAs } = await loadFixture(daoLockTokensPurchasedFixture);

      await expect(callLockAs(user).unlock(1n)).to.emit(lock, "Unlock").withArgs(1n);
      await expect(callLockAs(user).unlock(2n)).to.emit(lock, "Unlock").withArgs(2n);
      await expect(callLockAs(user2).unlock(3n)).to.emit(lock, "Unlock").withArgs(3n);

      expect(await callLockAs(user).keyTokenIds(0n)).to.equal(1n);
      expect(await callLockAs(user).keyTokenIds(1n)).to.equal(2n);
      expect(await callLockAs(user).keyTokenIds(2n)).to.equal(3n);

      await expect(callLockAs(user).cancelUnlock(2n)).to.emit(lock, "UnlockCancel").withArgs(2n);
      expect(await callLockAs(user).keyTokenIds(0n)).to.equal(1n);
      expect(await callLockAs(user).keyTokenIds(1n)).to.equal(3n);
      await expect(callLockAs(user).keyTokenIds(2n)).to.be.reverted;
    });

    it("Reverts when non-owner tries to cancel a key", async function () {
      const { user, user2, lock, callLockAs } = await loadFixture(daoLockTokensPurchasedFixture);

      await expect(callLockAs(user).unlock(1n)).to.emit(lock, "Unlock").withArgs(1n);
      await expect(callLockAs(user).unlock(2n)).to.emit(lock, "Unlock").withArgs(2n);
      await expect(callLockAs(user2).unlock(3n)).to.emit(lock, "Unlock").withArgs(3n);

      await expect(callLockAs(user2).cancelUnlock(2n)).to.be.revertedWith("Caller does not own NEU");
    });

    it("Reverts when canceling a key that has not been used", async function () {
      const { user, lock, callLockAs } = await loadFixture(daoLockTokensPurchasedFixture);

      await expect(callLockAs(user).unlock(1n)).to.emit(lock, "Unlock").withArgs(1n);

      await expect(callLockAs(user).cancelUnlock(2n)).to.be.revertedWith("NEU not found");
    });
  });

  describe("Receiving funds", function () {
    it("Receives funds when users get sponsor points", async function () {
      const { user, lock, callStorageAs } = await loadFixture(daoLockTokensPurchasedFixture);

      const dummyData = new Uint8Array(32);

      expect(await ethers.provider.getBalance(await lock.getAddress())).to.equal(0n);

      await (await callStorageAs(user).saveData(100001n, dummyData, { value: 10n ** 15n })).wait();

      expect(await ethers.provider.getBalance(await lock.getAddress())).to.equal(10n ** 15n);
    });
  });

  describe("Withdrawing funds", function () {
    it("Withdraws funds to DAO", async function () {
      const { user, lock, daoMockAddress, callLockAs } = await loadFixture(daoLockUnlockedFixture);

      expect(await ethers.provider.getBalance(daoMockAddress)).to.equal(0n);
      expect(await ethers.provider.getBalance(await lock.getAddress())).to.equal(10n ** 15n);

      await expect(callLockAs(user).withdraw()).to.emit(lock, "Withdraw").withArgs(10n ** 15n);

      expect(await ethers.provider.getBalance(daoMockAddress)).to.equal(10n ** 15n);
      expect(await ethers.provider.getBalance(await lock.getAddress())).to.equal(0n);
    });

    it("Withdraws when key is canceled but enough keys are left", async function () {
      const { user, user2, lock, daoMockAddress, callLockAs } = await loadFixture(daoLockUnlockedFixture);

      expect(await ethers.provider.getBalance(daoMockAddress)).to.equal(0n);
      expect(await ethers.provider.getBalance(await lock.getAddress())).to.equal(10n ** 15n);

      await expect(callLockAs(user2).cancelUnlock(3n)).to.emit(lock, "UnlockCancel").withArgs(3n);

      await expect(callLockAs(user).withdraw()).to.emit(lock, "Withdraw").withArgs(10n ** 15n);

      expect(await ethers.provider.getBalance(daoMockAddress)).to.equal(10n ** 15n);
      expect(await ethers.provider.getBalance(await lock.getAddress())).to.equal(0n);
    });

    it("Reverts when withdrawing before enough keys are unlocking", async function () {
      const { user, user2, lock, callLockAs } = await loadFixture(daoLockUnlockedFixture);

      await expect(callLockAs(user).cancelUnlock(1n)).to.emit(lock, "UnlockCancel").withArgs(1n);
      await expect(callLockAs(user2).cancelUnlock(3n)).to.emit(lock, "UnlockCancel").withArgs(3n);

      await expect(callLockAs(user).withdraw()).to.be.revertedWith("Not enough key tokens");
    });

    it("Reverts when withdrawing before DAO address is set", async function () {
      const { user, lock, callLockAs } = await loadFixture(daoLockFixture);

      await expect(callLockAs(user).withdraw()).to.be.revertedWith("NEU DAO address not set");
    });

    it("Reverts when withdrawing to DAO address that cannot receive funds", async function () {
      const { user, user2, user3, user4, operator, lock, metadata, callLockAs } = await loadFixture(daoLockUnlockedFixture);

      const lockAddress = await lock.getAddress() as `0x${string}`;
      const metadataAddress = await metadata.getAddress() as `0x${string}`;

      expect(await ethers.provider.getBalance(metadataAddress)).to.equal(0n);
      expect(await ethers.provider.getBalance(lockAddress)).to.equal(10n ** 15n);

      await expect(callLockAs(operator).setNeuDaoAddress(metadataAddress)).to.emit(lock, "AddressChange").withArgs(metadataAddress);

      await expect(callLockAs(user).unlock(1n)).to.emit(lock, "Unlock").withArgs(1n);
      await expect(callLockAs(user).unlock(2n)).to.emit(lock, "Unlock").withArgs(2n);
      await expect(callLockAs(user2).unlock(3n)).to.emit(lock, "Unlock").withArgs(3n);
      await expect(callLockAs(user2).unlock(4n)).to.emit(lock, "Unlock").withArgs(4n);
      await expect(callLockAs(user3).unlock(5n)).to.emit(lock, "Unlock").withArgs(5n);
      await expect(callLockAs(user3).unlock(6n)).to.emit(lock, "Unlock").withArgs(6n);
      await expect(callLockAs(user4).unlock(7n)).to.emit(lock, "Unlock").withArgs(7n);

      await expect(callLockAs(user).withdraw()).to.be.revertedWith("Failed to send Ether");

      expect(await ethers.provider.getBalance(metadataAddress)).to.equal(0n);
      expect(await ethers.provider.getBalance(lockAddress)).to.equal(10n ** 15n);
    });
  });

  describe("Access control", accessControlTestFactory(AccessControlSupportedContracts.Lock));
});