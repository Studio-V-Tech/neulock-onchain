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

    it("Reverts on entitled user saving data while calling with non-owned NEU on V1", async function () {
      const { callStorageAs, user } = await loadFixture(deployContractsV1Fixture);

      await expect(callStorageAs(user).saveData(0n, userDataBytesArray[5])).to.be.reverted;
    });

    it("Does not revert on entitled user saving data while calling with non-owned NEU on V2", async function () {
      const { callStorageAs, user } = await loadFixture(upgradeToStorageV2Fixture);

      await expect(callStorageAs(user).saveData(0n, userDataBytesArray[5])).not.to.be.reverted;
    });

    it("Retrieves data correctly after upgrade", async function () {
      const { callStorageAs, user, user2, user3, user4, user5 } = await loadFixture(upgradeToStorageV2Fixture);

      expect(await callStorageAs(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[1]);
      expect(await callStorageAs(user2).retrieveData(user2.address as `0x${string}`)).to.equal(userDataHexArray[2]);
      expect(await callStorageAs(user3).retrieveData(user3.address as `0x${string}`)).to.equal(userDataHexArray[3]);
      expect(await callStorageAs(user4).retrieveData(user4.address as `0x${string}`)).to.equal(userDataHexArray[4]);
      expect(await callStorageAs(user5).retrieveData(user5.address as `0x${string}`)).to.equal(userDataHexArray[5]);
    });

    it("Updates data correctly after upgrade", async function () {
      const { callStorageAs, user, user2, user3, user4, user5 } = await loadFixture(upgradeToStorageV2Fixture);

      await expect(callStorageAs(user).saveData(100001n, userDataBytesArray[5])).not.to.be.reverted;
      await expect(callStorageAs(user3).saveData(0n, userDataBytesArray[1])).not.to.be.reverted;
      await expect(callStorageAs(user5).saveData(100001n, userDataBytesArray[3])).not.to.be.reverted;

      expect(await callStorageAs(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[5]);
      expect(await callStorageAs(user2).retrieveData(user2.address as `0x${string}`)).to.equal(userDataHexArray[2]);
      expect(await callStorageAs(user3).retrieveData(user3.address as `0x${string}`)).to.equal(userDataHexArray[1]);
      expect(await callStorageAs(user4).retrieveData(user4.address as `0x${string}`)).to.equal(userDataHexArray[4]);
      expect(await callStorageAs(user5).retrieveData(user5.address as `0x${string}`)).to.equal(userDataHexArray[3]);
    });
  });
});