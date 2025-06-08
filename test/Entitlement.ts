import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { day, getRoles, userDataBytesArray } from "../scripts/lib/utils";
import { deployContractsFixture, entitlementFixture, purchasedOneTokenFixture, unlockFixture } from "./lib/fixtures";
import { accessControlTestFactory, AccessControlSupportedContracts } from "./lib/AccessControl";

describe("Entitlement", function () {
  describe("Deployment", function () {
    it("Deploys", async function () {
      const { entitlement } = await loadFixture(deployContractsFixture);

      expect(await entitlement.getAddress()).to.be.properAddress;
    });
  });

  describe("Contract management", function () {
    it("Has NEU entitlement contract after deployment", async function () {
      const { operator, callEntitlementAs, neu } = await loadFixture(deployContractsFixture);

      const firstAddress = await callEntitlementAs(operator).entitlementContractsV2(0n);

      expect(firstAddress).to.be.properAddress;
      expect(firstAddress).to.equal(await neu.getAddress());
    });

    it("Adds entitlement contract", async function () {
      const { operator, callEntitlementAs, unlockLock } = await loadFixture(unlockFixture);

      const lockAddress = await unlockLock.getAddress() as `0x${string}`;
      await expect(callEntitlementAs(operator).addEntitlementContract(lockAddress)).not.to.be.reverted;

      const secondContract = await callEntitlementAs(operator).entitlementContractsV2(1n);

      expect(secondContract).to.equal(lockAddress);
    });

    it("Reverts upon adding same entitlement contract twice", async function () {
      const { operator, callEntitlementAs, unlockLock } = await loadFixture(entitlementFixture);

      const lockAddress = await unlockLock.getAddress() as `0x${string}`;

      await expect(callEntitlementAs(operator).addEntitlementContract(lockAddress)).to.be.revertedWith("Entitlement contract already added");
    });

    it("Reverts upon adding NEU contract", async function () {
      const { operator, callEntitlementAs, neu } = await loadFixture(entitlementFixture);

      const neuAddress = await neu.getAddress() as `0x${string}`;

      await expect(callEntitlementAs(operator).addEntitlementContract(neuAddress)).to.be.revertedWith("Cannot add NEU contract");
    });

    it("Reverts upon adding contract that does not support balanceOf()", async function () {
      const { operator, callEntitlementAs, storage } = await loadFixture(entitlementFixture);

      const storageAddress = await storage.getAddress() as `0x${string}`;

      await expect(callEntitlementAs(operator).addEntitlementContract(storageAddress)).to.be.revertedWith("Contract does not support balanceOf()");
    });

    it("Reverts upon removing NEU entitlement contract", async function () {
      const { operator, callEntitlementAs, neu, unlockLock } = await loadFixture(entitlementFixture);

      const lockAddress = await unlockLock.getAddress() as `0x${string}`;
      const neuAddress = await neu.getAddress() as `0x${string}`;

      await expect(callEntitlementAs(operator).removeEntitlementContract(neuAddress)).to.be.revertedWith("Entitlement contract not found");

      const firstContract = await callEntitlementAs(operator).entitlementContractsV2(0n);
      const secondContract = await callEntitlementAs(operator).entitlementContractsV2(1n);

      expect(firstContract).to.equal(neuAddress);
      expect(secondContract).to.equal(lockAddress);
      await expect(callEntitlementAs(operator).entitlementContractsV2(2n)).to.be.reverted;
    });

    it("Removes additional entitlement contract", async function () {
      const { operator, callEntitlementAs, neu, unlockLock } = await loadFixture(entitlementFixture);

      const lockAddress = await unlockLock.getAddress() as `0x${string}`;
      const neuAddress = await neu.getAddress() as `0x${string}`;

      await expect(callEntitlementAs(operator).removeEntitlementContract(lockAddress)).not.to.be.reverted;

      const firstContract = await callEntitlementAs(operator).entitlementContractsV2(0n);

      expect(firstContract).to.equal(neuAddress);
      await expect(callEntitlementAs(operator).entitlementContractsV2(1n)).to.be.reverted;
    });
  });

  describe("Entitlement permissions", function () {
    it("Reverts upon removing non-existent entitlement contract", async function () {
      const { operator, callEntitlementAs } = await loadFixture(entitlementFixture);

      await expect(callEntitlementAs(operator).removeEntitlementContract(operator.address as `0x${string}`)).to.be.revertedWith("Entitlement contract not found");
    });

    it("Allows caller with only NEU entitlement", async function () {
      const { callStorageAs, user2 } = await loadFixture(entitlementFixture);

      await expect(callStorageAs(user2).saveData(0n, userDataBytesArray[5])).not.to.be.reverted;
    });

    it("Allows caller with only additional entitlement", async function () {
      const { callStorageAs, user3 } = await loadFixture(entitlementFixture);

      await expect(callStorageAs(user3).saveData(0n, userDataBytesArray[5])).not.to.be.reverted;
    });

    it("Allows caller with both NEU and additional entitlement", async function () {
      const { callStorageAs, user } = await loadFixture(entitlementFixture);

      await expect(callStorageAs(user).saveData(0n, userDataBytesArray[5])).not.to.be.reverted;
    });

    it("Disallows caller who does not have entitlement", async function () {
      const { callStorageAs, user4 } = await loadFixture(entitlementFixture);

      await expect(callStorageAs(user4).saveData(0n, userDataBytesArray[0])).to.be.revertedWith("Caller does not have entitlement");
    });

    it("Disallows caller who only had additional entitlement after it expired", async function () {
      const { callStorageAs, user3 } = await loadFixture(entitlementFixture);

      await expect(callStorageAs(user3).saveData(0n, userDataBytesArray[5])).not.to.be.reverted;

      await time.increase(day * 5);
      await expect(callStorageAs(user3).saveData(0n, userDataBytesArray[4])).not.to.be.reverted;

      await time.increase(day * 31);
      await expect(callStorageAs(user3).saveData(0n, userDataBytesArray[3])).to.be.revertedWith("Caller does not have entitlement");
    });
  });

  describe("User entitlement listing", function () {
    it("Lists entitlement for user with only NEU tokens", async function () {
      const { callEntitlementAs, user2, user5, neu } = await loadFixture(entitlementFixture);
      
      const neuAddress = await neu.getAddress() as `0x${string}`;
      const user2Address = user2.address as `0x${string}`;

      const entitlements = await callEntitlementAs(user5).userEntitlementContracts(user2Address);

      expect(entitlements).to.have.lengthOf(1);
      expect(entitlements[0]).to.equal(neuAddress);
    });

    it("Lists entitlement for user with only additional entitlement", async function () {
      const { callEntitlementAs, user3, user5, unlockLock } = await loadFixture(entitlementFixture);

      const lockAddress = await unlockLock.getAddress() as `0x${string}`;
      const user3Address = user3.address as `0x${string}`;

      const entitlements = await callEntitlementAs(user5).userEntitlementContracts(user3Address);

      expect(entitlements).to.have.lengthOf(1);
      expect(entitlements[0]).to.equal(lockAddress);
    });

    it("Lists entitlement for user with both NEU and additional entitlement", async function () {
      const { callEntitlementAs, user, user5, neu, unlockLock } = await loadFixture(entitlementFixture);

      const neuAddress = await neu.getAddress() as `0x${string}`;
      const lockAddress = await unlockLock.getAddress() as `0x${string}`;
      const userAddress = user.address as `0x${string}`;

      const entitlements = await callEntitlementAs(user5).userEntitlementContracts(userAddress);

      expect(entitlements).to.have.lengthOf(2);
      expect(entitlements[0]).to.equal(neuAddress);
      expect(entitlements[1]).to.equal(lockAddress);
    });

    it("Lists entitlement for user with no entitlement", async function () {
      const { callEntitlementAs, user4, user5 } = await loadFixture(entitlementFixture);

      const user4Address = user4.address as `0x${string}`;

      const entitlements = await callEntitlementAs(user5).userEntitlementContracts(user4Address);

      expect(entitlements).to.have.lengthOf(0);
    });
  });

  describe("NEU Entitlement after transfers", function () {
    it("Has entitlement immediately upon minting", async function () {
      const { user, callEntitlementAs } = await loadFixture(purchasedOneTokenFixture);

      const hasEntitlementImmediately = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);

      expect(hasEntitlementImmediately).to.be.true;
    });

    it("Has entitlement one second after first transfer", async function () {
      const { user, user2, callNeuAs, callEntitlementAs } = await loadFixture(purchasedOneTokenFixture);

      await (await callNeuAs(user).transferFrom(user.address as `0x${string}`, user2.address as `0x${string}`, 1n)).wait();

      const hasEntitlementImmediately = await callEntitlementAs(user2).hasEntitlement(user2.address as `0x${string}`);

      expect(hasEntitlementImmediately).to.be.false;
 
      await time.increase(1);

      const hasEntitlementAfterASecond = await callEntitlementAs(user2).hasEntitlement(user2.address as `0x${string}`);

      expect(hasEntitlementAfterASecond).to.be.true;
    });

    it("Gets entitlement after cooldown when transferred less than a week after start of entitlement", async function () {
      const { user, user2, callNeuAs, callEntitlementAs } = await loadFixture(purchasedOneTokenFixture);

      await (await callNeuAs(user).transferFrom(user.address as `0x${string}`, user2.address as `0x${string}`, 1n)).wait();

      await time.increase(day);

      await (await callNeuAs(user2).transferFrom(user2.address as `0x${string}`, user.address as `0x${string}`, 1n)).wait();

      const hasEntitlementImmediately = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);

      expect(hasEntitlementImmediately).to.be.false;

      await time.increase(6 * day - 1);

      const hasEntitlementAfterAWeek = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);
      expect(hasEntitlementAfterAWeek).to.be.false;

      await time.increase(1);

      const hasEntitlementAfterACooldownPeriod = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);
      expect(hasEntitlementAfterACooldownPeriod).to.be.true;
    });

    it("Gets entitlement after one second when transferred exactly a week after start of entitlement", async function () {
      const { user, user2, callNeuAs, callEntitlementAs } = await loadFixture(purchasedOneTokenFixture);

      await (await callNeuAs(user).transferFrom(user.address as `0x${string}`, user2.address as `0x${string}`, 1n)).wait();

      await time.increase(7 * day);

      await (await callNeuAs(user2).transferFrom(user2.address as `0x${string}`, user.address as `0x${string}`, 1n)).wait();

      const hasEntitlementImmediately = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);
      expect(hasEntitlementImmediately).to.be.false;

      await time.increase(1);

      const hasEntitlementAfterASecond = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);
      expect(hasEntitlementAfterASecond).to.be.true;
    });

    it("Gets entitlement after one second when transferred more than a week after start of entitlement", async function () {
      const { user, user2, callNeuAs, callEntitlementAs } = await loadFixture(purchasedOneTokenFixture);

      await (await callNeuAs(user).transferFrom(user.address as `0x${string}`, user2.address as `0x${string}`, 1n)).wait();

      await time.increase(30 * day);

      await (await callNeuAs(user2).transferFrom(user2.address as `0x${string}`, user.address as `0x${string}`, 1n)).wait();

      const hasEntitlementImmediately = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);
      expect(hasEntitlementImmediately).to.be.false;

      await time.increase(1);

      const hasEntitlementAfterASecond = await callEntitlementAs(user).hasEntitlement(user.address as `0x${string}`);
      expect(hasEntitlementAfterASecond).to.be.true;
    });
  });

  describe("Access control specifics", function () {
    it("Obeys new roles in add contract calls", async function () {
      const { admin, operator, user, callEntitlementAs, unlockLock } = await loadFixture(unlockFixture);

      const lockAddress = await unlockLock.getAddress() as `0x${string}`;
      const { operatorRole } = getRoles();

      await (await callEntitlementAs(admin).grantRole(operatorRole, user.address as `0x${string}`)).wait();
      await (await callEntitlementAs(admin).revokeRole(operatorRole, operator.address as `0x${string}`)).wait();

      await expect(callEntitlementAs(operator).addEntitlementContract(lockAddress)).to.be.reverted;
      await expect(callEntitlementAs(user).addEntitlementContract(lockAddress)).not.to.be.reverted;
    });

    it("Obeys new roles in remove contract calls", async function () {
      const { admin, operator, user, callEntitlementAs, unlockLock } = await loadFixture(entitlementFixture);

      const lockAddress = await unlockLock.getAddress() as `0x${string}`;
      const { operatorRole } = getRoles();

      await (await callEntitlementAs(admin).grantRole(operatorRole, user.address as `0x${string}`)).wait();
      await (await callEntitlementAs(admin).revokeRole(operatorRole, operator.address as `0x${string}`)).wait();

      await expect(callEntitlementAs(operator).removeEntitlementContract(lockAddress)).to.be.reverted;
      await expect(callEntitlementAs(user).removeEntitlementContract(lockAddress)).not.to.be.reverted;
    });
  });

  describe("Access control", accessControlTestFactory(AccessControlSupportedContracts.Entitlement));
});
