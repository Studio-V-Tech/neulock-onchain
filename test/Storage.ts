import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { userDataBytesArray, userDataHexArray } from "../scripts/lib/utils";
import { deployContractsFixture, purchasedTokensFixture, setUserDataFixture } from "./lib/fixtures";
import { accessControlTestFactory, AccessControlSupportedContracts } from "./lib/AccessControl";

describe("Storage", function () {
  describe("Deployment", function () {
    it("Deploys", async function () {
      const { storage } = await loadFixture(deployContractsFixture);

      expect(await storage.getAddress()).to.be.properAddress;
    });
  });

  describe("User data", function () {
    it("Saves data correctly without buying sponsor points", async function () {
      const { callStorageAs, user } = await loadFixture(purchasedTokensFixture);

      await expect(callStorageAs(user).saveData(100001n, userDataBytesArray[0])).not.to.be.reverted;
    });

    it("Saves data correctly while buying sponsor points", async function () {
      const { callStorageAs, user } = await loadFixture(purchasedTokensFixture);

      await expect(callStorageAs(user).saveData(100001n, userDataBytesArray[0], { value: (10n ** 14n) })).not.to.be.reverted;
    });

    it("Retrieves data correctly", async function () {
      const { callStorageAs, user, user2, user3, user4, user5 } = await loadFixture(setUserDataFixture);

      expect(await callStorageAs(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[1]);
      expect(await callStorageAs(user2).retrieveData(user2.address as `0x${string}`)).to.equal(userDataHexArray[2]);
      expect(await callStorageAs(user3).retrieveData(user3.address as `0x${string}`)).to.equal(userDataHexArray[3]);
      expect(await callStorageAs(user4).retrieveData(user4.address as `0x${string}`)).to.equal(userDataHexArray[4]);
      expect(await callStorageAs(user5).retrieveData(user5.address as `0x${string}`)).to.equal(userDataHexArray[5]);
    });

    it("Updates data correctly", async function () {
      const { callStorageAs, user } = await loadFixture(setUserDataFixture);

      await expect(callStorageAs(user).saveData(100001n, userDataBytesArray[5])).not.to.be.reverted;
      expect(await callStorageAs(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[5]);
    });

    it("Reverts on saving data if caller does not have entitlement", async function () {
      const { callStorageAs, user } = await loadFixture(deployContractsFixture);

      await expect(callStorageAs(user).saveData(0n, userDataBytesArray[0])).to.be.revertedWith("Caller does not have entitlement");
    });

    it("Updates data if caller does not own called NEU but has entitlement", async function () {
      const { callStorageAs, user } = await loadFixture(purchasedTokensFixture);

      await expect(callStorageAs(user).saveData(2n, userDataBytesArray[0])).not.to.be.reverted;
      expect(await callStorageAs(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[0]);
    });

    it("Reverts on saving data if caller does not own called NEU and does not have entitlement", async function () {
      const { callStorageAs, upgrader } = await loadFixture(purchasedTokensFixture);

      await expect(callStorageAs(upgrader).saveData(100001n, userDataBytesArray[0])).to.be.revertedWith("Caller does not have entitlement");
    });

    it("Reverts on saving data if value exists and is not enough", async function () {
      const { callStorageAs, user } = await loadFixture(purchasedTokensFixture);

      await expect(callStorageAs(user).saveData(100001n, userDataBytesArray[0], { value: (10n ** 14n - 1n) })).to.be.revertedWith("Not enough ETH sent");
    });
  });

  describe("Access control", accessControlTestFactory(AccessControlSupportedContracts.Storage));
});