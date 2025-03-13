import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { userDataBytesArray, userDataHexArray } from "../scripts/lib/utils";
import { deployContractsV1Fixture, upgradeToStorageV2Fixture } from "./lib/upgrade-fixtures";

describe("Upgrades", function () {
  describe("V1 deployments", function () {
    it("Deploys V1 contracts", async function () {
      const { neuV1, metadataV1, storageV1, entitlementV1 } = await loadFixture(deployContractsV1Fixture);

      expect(await neuV1.getAddress()).to.be.properAddress;
      expect(await metadataV1.getAddress()).to.be.properAddress;
      expect(await storageV1.getAddress()).to.be.properAddress;
      expect(await entitlementV1.getAddress()).to.be.properAddress;
    });
  });

  describe("Storage V2 upgrade", function () {
    it("Upgrades storage to V2", async function () {
      const { storageV2 } = await loadFixture(upgradeToStorageV2Fixture);

      expect(await storageV2.getAddress()).to.be.properAddress;
    });

    it("Reverts on running reinitialize function on V2 again", async function () {
      const { upgrader, user, storageV2, callStorageV2As, entitlementV1 } = await loadFixture(upgradeToStorageV2Fixture);

      const entitlementAddress = await entitlementV1.getAddress();

      await expect(callStorageV2As(upgrader).initializeV2(entitlementAddress as `0x${string}`)).to.be.revertedWithCustomError(storageV2, 'InvalidInitialization');
      await expect(callStorageV2As(user).initializeV2(entitlementAddress as `0x${string}`)).to.be.revertedWithCustomError(storageV2, 'InvalidInitialization');
    });

    it("Reverts on entitled user saving data while calling with non-owned NEU on V1", async function () {
      const { callStorageV1As, user } = await loadFixture(deployContractsV1Fixture);

      await expect(callStorageV1As(user).saveData(0n, userDataBytesArray[5])).to.be.reverted;
    });

    it("Does not revert on entitled user saving data while calling with non-owned NEU on V2", async function () {
      const { callStorageV2As, user } = await loadFixture(upgradeToStorageV2Fixture);

      await expect(callStorageV2As(user).saveData(0n, userDataBytesArray[5])).not.to.be.reverted;
    });

    it("Retrieves data correctly after upgrade", async function () {
      const { callStorageV2As, user, user2, user3, user4, user5 } = await loadFixture(upgradeToStorageV2Fixture);

      expect(await callStorageV2As(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[1]);
      expect(await callStorageV2As(user2).retrieveData(user2.address as `0x${string}`)).to.equal(userDataHexArray[2]);
      expect(await callStorageV2As(user3).retrieveData(user3.address as `0x${string}`)).to.equal(userDataHexArray[3]);
      expect(await callStorageV2As(user4).retrieveData(user4.address as `0x${string}`)).to.equal(userDataHexArray[4]);
      expect(await callStorageV2As(user5).retrieveData(user5.address as `0x${string}`)).to.equal(userDataHexArray[5]);
    });

    it("Updates data correctly after upgrade", async function () {
      const { callStorageV2As, user, user2, user3, user4, user5 } = await loadFixture(upgradeToStorageV2Fixture);

      await expect(callStorageV2As(user).saveData(100001n, userDataBytesArray[5])).not.to.be.reverted;
      await expect(callStorageV2As(user3).saveData(0n, userDataBytesArray[1])).not.to.be.reverted;
      await expect(callStorageV2As(user5).saveData(100001n, userDataBytesArray[3])).not.to.be.reverted;

      expect(await callStorageV2As(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[5]);
      expect(await callStorageV2As(user2).retrieveData(user2.address as `0x${string}`)).to.equal(userDataHexArray[2]);
      expect(await callStorageV2As(user3).retrieveData(user3.address as `0x${string}`)).to.equal(userDataHexArray[1]);
      expect(await callStorageV2As(user4).retrieveData(user4.address as `0x${string}`)).to.equal(userDataHexArray[4]);
      expect(await callStorageV2As(user5).retrieveData(user5.address as `0x${string}`)).to.equal(userDataHexArray[3]);
    });
  });
});