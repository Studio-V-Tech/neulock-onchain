import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

import {
  day,
  seriesValue,
  stringToBytes,
  TokenMetadata,
  userDataBytesArray,
  userDataHexArray,
  validateSvg,
  validateTokenMetadataCommonAttributes,
  stringToHex32Bytes,
} from "../scripts/lib/utils";
import {
  deployContractsV1Fixture,
  upgradeToStorageV2Fixture,
  upgradeToNeuV2Fixture,
  upgradeToMetadataV2Fixture,
  upgradeToV3Fixture,
} from "./lib/upgrade-fixtures";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import MetadataBaseContract from "../scripts/interfaces/metadata.model";
import { BaseContract } from "ethers";
import { NeuEntitlementV1 } from "../typechain-types";
import traitMetadataUri from "../scripts/trait-metadata-uri";

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

  describe("Neu V2 upgrade", function () {
    it("Upgrades Neu to V2", async function () {
      const { neuV2 } = await loadFixture(upgradeToNeuV2Fixture);

      expect(await neuV2.getAddress()).to.be.properAddress;
    });

    it("Keeps token ownership after upgrade", async function () {
      const { user, user2, user3, user4, user5, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      expect(await callNeuV2As(user).ownerOf(100001n)).to.equal(user.address);
      expect(await callNeuV2As(user).ownerOf(1n)).to.equal(user2.address);
      expect(await callNeuV2As(user).ownerOf(100002n)).to.equal(user3.address);
      expect(await callNeuV2As(user).ownerOf(2n)).to.equal(user2.address);
      expect(await callNeuV2As(user).ownerOf(100003n)).to.equal(user3.address);
      expect(await callNeuV2As(user).ownerOf(3n)).to.equal(user3.address);
      expect(await callNeuV2As(user).ownerOf(100004n)).to.equal(user4.address);
      expect(await callNeuV2As(user).ownerOf(100005n)).to.equal(user5.address);
      expect(await callNeuV2As(user).ownerOf(5n)).to.equal(user5.address);
    });

    it("Mints token correctly to specific address", async function () {
      const { operator, user, callNeuV2As, callMetadataV1As, ogId } = await loadFixture(upgradeToNeuV2Fixture);

      const userAddress = user.address as `0x${string}`;

      await (await callNeuV2As(operator).safeMint(user.address, ogId)).wait();

      const balance = await callNeuV2As(user).balanceOf(userAddress);
      const owner = await callNeuV2As(user).ownerOf(6n);
      const og = await callMetadataV1As(user).getSeries(ogId);

      expect(balance).to.equal(2);
      expect(owner).to.equal(userAddress);
      expect(og.mintedTokens).to.equal(6);
    });


    it("Mints token from series not available for public minting", async function () {
      const { operator, user, callNeuV2As, callMetadataV1As, ogId } = await loadFixture(upgradeToNeuV2Fixture);

      const userAddress = user.address as `0x${string}`;

      await (await callMetadataV1As(operator).setSeriesAvailability(ogId, false)).wait();
      await (await callNeuV2As(operator).safeMint(user.address, ogId)).wait();

      const balance = await callNeuV2As(user).balanceOf(userAddress);
      const owner = await callNeuV2As(user).ownerOf(6n);
      const og = await callMetadataV1As(user).getSeries(ogId);

      expect(balance).to.equal(2);
      expect(owner).to.equal(userAddress);
      expect(og.mintedTokens).to.equal(6);
    });

    it("Reverts on private minting for non-operator", async function () {
      const { user, callNeuV2As, wagmiId } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user).safeMint(user.address, wagmiId)).to.be.reverted;
    });

    it("Gets token IDs for all tokens owned by user with no balance", async function () {
      const { admin, user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      const tokenIds = await callNeuV2As(user).getTokensOfOwner(admin.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(0);
    });

    it("Gets token IDs for all tokens owned by user with balance of one self-minted token", async function () {
      const { user, user4, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      const tokenIds = await callNeuV2As(user).getTokensOfOwner(user4.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(1);
      expect(tokenIds[0]).to.equal(100004n);
    });

    it("Gets token IDs for all tokens owned by user with balance of four self-minted tokens", async function () {
      const { user, user3, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      const tokenIds = await callNeuV2As(user).getTokensOfOwner(user3.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(4);
      expect([...tokenIds]).to.have.members([3n, 4n, 100002n, 100003n]);
    });

    it("Gets token IDs for all tokens owned by user with balance of two private-minted tokens", async function () {
      const { user, user5, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      const tokenIds = await callNeuV2As(user).getTokensOfOwner(user5.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(2);
      expect([...tokenIds]).to.have.members([5n, 100005n]);
    });

    it("Burns token correctly", async function () {
      const { user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      const userAddress = user.address as `0x${string}`;

      const previousBalance = await callNeuV2As(user).balanceOf(userAddress);
      await (await callNeuV2As(user).burn(100001n)).wait();

      const currentBalance = await callNeuV2As(user).balanceOf(userAddress);

      expect(previousBalance - currentBalance).to.equal(1);
    });

    it("Reverts on burning non-existent token", async function () {
      const { user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user).burn(42n)).to.be.reverted;
    });

    it("Reverts on burning token owned by someone else", async function () {
      const { user, operator, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user).burn(1n)).to.be.reverted;
      await expect(callNeuV2As(operator).burn(100001n)).to.be.reverted;
    });

    it("Withdraws correctly", async function () {
      const { operator, callNeuV2As, callMetadataV1As, wagmiId, ogId, sponsorTransferTotal } = await loadFixture(upgradeToNeuV2Fixture);

      await time.increase(7 * day);

      const wagmi = await callMetadataV1As(operator).getSeries(wagmiId);
      const og = await callMetadataV1As(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuV2As(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + sponsorTransferTotal + 4n * seriesValue(wagmi).valueOf() + 4n * seriesValue(og).valueOf() - gas);
    });

    it("Withdraws no token minting revenue during refund window", async function () {
      const { operator, callNeuV2As, sponsorTransferTotal } = await loadFixture(upgradeToNeuV2Fixture);

      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuV2As(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(balanceBefore + sponsorTransferTotal - gas);
    });

    it("Withdraws only value of tokens older than refund window", async function () {
      const { operator, callNeuV2As, callMetadataV1As, wagmiId, ogId, sponsorTransferTotal } = await loadFixture(upgradeToNeuV2Fixture);

      await time.increase(3 * day);

      const wagmi = await callMetadataV1As(operator).getSeries(wagmiId);
      const og = await callMetadataV1As(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuV2As(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + sponsorTransferTotal + 2n * seriesValue(wagmi).valueOf() + 1n * seriesValue(og).valueOf() - gas);
    });

    it("Withdraws only non-refunded tokens", async function () {
      const { operator, user3, callNeuV2As, callMetadataV1As, wagmiId, ogId, sponsorTransferTotal } = await loadFixture(upgradeToNeuV2Fixture);

      await (await callNeuV2As(user3).refund(3n)).wait();
      await (await callNeuV2As(user3).refund(100003n)).wait();

      await time.increase(7 * day);

      const wagmi = await callMetadataV1As(operator).getSeries(wagmiId);
      const og = await callMetadataV1As(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuV2As(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + sponsorTransferTotal + 3n * seriesValue(wagmi).valueOf() + 3n * seriesValue(og).valueOf() - gas);
    });

    it("Withdraws once per token", async function () {
      const { operator, callNeuV2As, callMetadataV1As, wagmiId, ogId } = await loadFixture(upgradeToNeuV2Fixture);

      const wagmi = await callMetadataV1As(operator).getSeries(wagmiId);
      const og = await callMetadataV1As(operator).getSeries(ogId);

      await time.increase(3 * day);
      await (await callNeuV2As(operator).withdraw()).wait();
      await time.increase(day);

      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuV2As(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(balanceBefore + seriesValue(wagmi).valueOf() + seriesValue(og).valueOf() - gas);
    });

    it("Withdraws with value of token burned during refund window", async function () {
      const { operator, user3, callNeuV2As, callMetadataV1As, ogId, sponsorTransferTotal } = await loadFixture(upgradeToNeuV2Fixture);

      await (await callNeuV2As(user3).burn(3n)).wait();

      const og = await callMetadataV1As(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuV2As(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + sponsorTransferTotal + seriesValue(og).valueOf() - gas);
    });

    it("Reverts on non-operator withdraw", async function () {
      const { user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user).withdraw()).to.be.reverted;
    });

    it("Refunds correctly", async function () {
      const { user, callNeuV2As, callMetadataV1As, wagmiId } = await loadFixture(upgradeToNeuV2Fixture);

      const wagmi = await callMetadataV1As(user).getSeries(wagmiId);
      const balanceBefore = await ethers.provider.getBalance(user.address);

      const refundReceipt = await (await callNeuV2As(user).refund(100001n)).wait();
      const gas = refundReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(user.address);

      expect(balanceAfter).to.equal(balanceBefore + seriesValue(wagmi).valueOf() - gas);
    });

    it("Refunds original value after series price change", async function () {
      const { user, operator, callNeuV2As, callMetadataV1As, wagmiId } = await loadFixture(upgradeToNeuV2Fixture);

      const wagmi = await callMetadataV1As(user).getSeries(wagmiId);
      const originalValue = seriesValue(wagmi).valueOf();
      const balanceBefore = await ethers.provider.getBalance(user.address);

      await (await callMetadataV1As(operator).setPriceInGwei(wagmiId, 42n)).wait();

      const refundReceipt = await (await callNeuV2As(user).refund(100001n)).wait();
      const gas = refundReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(user.address);

      expect(balanceAfter).to.equal(balanceBefore + originalValue - gas);
    });

    it("Burns token after refund", async function () {
      const { user2, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      const user2Address = user2.address as `0x${string}`;
      const supplyBefore = await callNeuV2As(user2).totalSupply();
      const balanceBefore = await callNeuV2As(user2).balanceOf(user2Address);
      const ownerBefore = await callNeuV2As(user2).ownerOf(2n);

      await (await callNeuV2As(user2).refund(2n)).wait();

      const supplyAfter = await callNeuV2As(user2).totalSupply();
      const balanceAfter = await callNeuV2As(user2).balanceOf(user2Address);

      expect(ownerBefore).to.equal(user2Address);
      expect(supplyAfter).to.equal(supplyBefore.valueOf() - 1n)
      expect(balanceAfter).to.equal(balanceBefore.valueOf() - 1n)
      await expect(callNeuV2As(user2).ownerOf(2n)).to.be.reverted;
    });

    it("Refunds token only once", async function () {
      const { user2, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user2).refund(2n)).not.to.be.reverted;
      await expect(callNeuV2As(user2).refund(2n)).to.be.reverted;
    });

    it("Reverts on refunding non-existent token", async function () {
      const { user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user).refund(42n)).to.be.reverted;
    });

    it("Reverts on refunding token owned by someone else", async function () {
      const { user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user).refund(2n)).to.be.revertedWith("Caller is not token owner");
    });

    it("Reverts on refunding non-refundable token", async function () {
      const { user5, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await expect(callNeuV2As(user5).refund(5n)).to.be.revertedWith("Token is not refundable");
      await expect(callNeuV2As(user5).refund(100005n)).to.be.revertedWith("Token is not refundable");
    });

    it("Reverts on refunding after refund window", async function () {
      const { user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      await time.increase(2 * day);

      await expect(callNeuV2As(user).refund(100001n)).to.be.revertedWith("Refund window has passed");
    });

    it("Gets token metadata correctly", async function () {
      const { user, callNeuV2As } = await loadFixture(upgradeToNeuV2Fixture);

      const ogTokenURIBase64 = await callNeuV2As(user).tokenURI(1n);
      const ogTokenMetadata: TokenMetadata = JSON.parse(Buffer.from(ogTokenURIBase64.split(",")[1], "base64").toString("utf-8"));

      const wagmiTokenURIBase64 = await callNeuV2As(user).tokenURI(100002n);
      const wagmiTokenMetadata: TokenMetadata = JSON.parse(Buffer.from(wagmiTokenURIBase64.split(",")[1], "base64").toString("utf-8"));

      validateTokenMetadataCommonAttributes(ogTokenMetadata);

      expect(ogTokenMetadata.name).to.equal("NEU #1 OG1");
      expect(ogTokenMetadata.attributes[0].value).to.equal("OG1");
      expect(ogTokenMetadata.attributes[1].value).to.equal("Yes");
      expect(ogTokenMetadata.attributes[2].value).to.equal(100);

      validateTokenMetadataCommonAttributes(wagmiTokenMetadata);

      expect(wagmiTokenMetadata.name).to.equal("NEU #100002 WAGMI1");
      expect(wagmiTokenMetadata.attributes[0].value).to.equal("WAGMI1");
      expect(wagmiTokenMetadata.attributes[1].value).to.equal("No");
      expect(wagmiTokenMetadata.attributes[2].value).to.equal(1000);
    });
  });

  describe("Metadata V2 upgrade", function () {
    it("Upgrades Metadata to V2", async function () {
      const { metadataV2 } = await loadFixture(upgradeToMetadataV2Fixture);

      expect(await metadataV2.getAddress()).to.be.properAddress;
    });

    it("Gets dynamic trait correctly", async function () {
      const { user, callMetadataV2As } = await loadFixture(upgradeToMetadataV2Fixture);

      const pointsTrait = stringToHex32Bytes("points");

      const token1TraitBytes = await callMetadataV2As(user).getTraitValue(1n, pointsTrait);
      const token100001TraitBytes = await callMetadataV2As(user).getTraitValue(100001n, pointsTrait);
      const token2TraitBytes = await callMetadataV2As(user).getTraitValue(2n, pointsTrait);
      const token3TraitBytes = await callMetadataV2As(user).getTraitValue(3n, pointsTrait);
      const token100004TraitBytes = await callMetadataV2As(user).getTraitValue(100004n, pointsTrait);
      const token5TraitBytes = await callMetadataV2As(user).getTraitValue(5n, pointsTrait);


      expect(parseInt(token1TraitBytes.substring(2), 16)).to.equal(1_337);
      expect(parseInt(token100001TraitBytes.substring(2), 16)).to.equal(0);
      expect(parseInt(token2TraitBytes.substring(2), 16)).to.equal(1_338);
      expect(parseInt(token3TraitBytes.substring(2), 16)).to.equal(1_437);
      expect(parseInt(token100004TraitBytes.substring(2), 16)).to.equal(10_000);
      expect(parseInt(token5TraitBytes.substring(2), 16)).to.equal(9_000_000);
    });

    it("Reverts on getting nonexistant dynamic trait", async function () {
      const { user, callMetadataV2As } = await loadFixture(upgradeToMetadataV2Fixture);

      const nonexistantTrait = stringToHex32Bytes("nonexistant");

      await expect(callMetadataV2As(user).getTraitValue(1n, nonexistantTrait)).to.be.revertedWith("Trait key not found");
    });

    it("Gets multiple dynamic traits correctly", async function () {
      const { user, callMetadataV2As } = await loadFixture(upgradeToMetadataV2Fixture);

      const pointsTrait = stringToHex32Bytes("points");

      const ogTokenTraitBytes = await callMetadataV2As(user).getTraitValues(1n, [pointsTrait]);

      const ogTokenTrait = ogTokenTraitBytes.map((trait) => parseInt(trait.substring(2), 16));

      expect(ogTokenTrait[0]).to.equal(1_337);
    });

    it("Gets series availability correctly", async function () {
      const { user, callMetadataV2As, wagmiId, ogId, uniqueId } = await loadFixture(upgradeToMetadataV2Fixture);

      expect(await callMetadataV2As(user).isSeriesAvailable(wagmiId)).to.be.true;
      expect(await callMetadataV2As(user).isSeriesAvailable(ogId)).to.be.true;
      expect(await callMetadataV2As(user).isSeriesAvailable(uniqueId)).to.be.true;
      expect(await callMetadataV2As(user).isSeriesAvailable(42n)).to.be.false;
    });

    it("Gets minted count correctly", async function () {
      const { user, callMetadataV2As, wagmiId, ogId, uniqueId } = await loadFixture(upgradeToMetadataV2Fixture);

      const wagmi = await callMetadataV2As(user).getSeries(wagmiId);
      const og = await callMetadataV2As(user).getSeries(ogId);
      const unique = await callMetadataV2As(user).getSeries(uniqueId);

      expect(wagmi.mintedTokens).to.equal(5);
      expect(og.mintedTokens).to.equal(5);
      expect(unique.mintedTokens).to.equal(0);
    });

    it("Reverts when adding series with existing name", async function () {
      const { operator, callMetadataV2As } = await loadFixture(upgradeToMetadataV2Fixture);

      await expect(callMetadataV2As(operator).addSeries(stringToBytes('WAGMI1'), 1337n * 10n ** 4n, 200000n, 1000n, 1000n, 1000n, 1000n, true)).to.be.revertedWith("Series name already exists");
    });

    it("Reverts when adding series overlapping with existing one", async function () {
      const { operator, callMetadataV2As } = await loadFixture(upgradeToMetadataV2Fixture);

      await expect(callMetadataV2As(operator).addSeries(stringToBytes('WAGMIOVL'), 1337n * 10n ** 4n, 100001n, 1000n, 1000n, 1000n, 1000n, true)).to.be.revertedWith( "Series overlaps with existing");
      await expect(callMetadataV2As(operator).addSeries(stringToBytes('WAGMIOVL'), 1337n * 10n ** 4n, 100000n, 2n, 1000n, 1000n, 1000n, true)).to.be.revertedWith( "Series overlaps with existing");
      await expect(callMetadataV2As(operator).addSeries(stringToBytes('WAGMIOVL'), 1337n * 10n ** 4n, 101000n, 1000n, 1000n, 1000n, 1000n, true)).to.be.revertedWith( "Series overlaps with existing");
    });

    it("Gets availability correctly", async function () {
      const { user, callMetadataV2As, wagmiId, ogId, uniqueId } = await loadFixture(upgradeToMetadataV2Fixture);
      const available = await callMetadataV2As(user).getAvailableSeries();

      expect(available).to.have.lengthOf(3);

      expect(available[0]).to.equal(wagmiId);
      expect(available[1]).to.equal(uniqueId);
      expect(available[2]).to.equal(ogId);
    });

    it("Gets logo correctly", async function () {
      const { operator, user, callMetadataV2As, wagmiId } = await loadFixture(upgradeToMetadataV2Fixture);

      const wagmi = await callMetadataV2As(user).getSeries(wagmiId);

      validateSvg(wagmi.logoSvg);
    });

    it("Gets price correctly", async function () {
      const { user, callMetadataV2As, wagmiId } = await loadFixture(upgradeToMetadataV2Fixture);

      const wagmi = await callMetadataV2As(user).getSeries(wagmiId);

      expect(wagmi.priceInGwei).to.equal(1337n * 10n ** 4n);
    });

    it("Sets price correctly", async function () {
      const { operator, user, callMetadataV2As, wagmiId } = await loadFixture(upgradeToMetadataV2Fixture);

      await (await callMetadataV2As(operator).setPriceInGwei(wagmiId, 42n)).wait();

      const wagmi = await callMetadataV2As(user).getSeries(wagmiId);

      expect(wagmi.priceInGwei).to.equal(42n);
    });

    it("Reverts on setting price for non-existent series", async function () {
      const { operator, callMetadataV2As } = await loadFixture(upgradeToMetadataV2Fixture);

      await expect(callMetadataV2As(operator).setPriceInGwei(42n, 42n)).to.be.revertedWith("Invalid series index");
    });

    it("Reverts on setting price for non-operator", async function () {
      const { user, callMetadataV2As, wagmiId } = await loadFixture(upgradeToMetadataV2Fixture);

      await expect(callMetadataV2As(user).setPriceInGwei(wagmiId, 42n)).to.be.reverted;
    });
  });

  describe("Neu V3 upgrade", function () {
    it("Upgrades Neu to V3", async function () {
      const { neuV3 } = await loadFixture(upgradeToV3Fixture);

      expect(await neuV3.getAddress()).to.be.properAddress;
    });

    it("Reverts if initializing V3 before upgrading Metadata", async function () {
      const { neuV2, upgrader, operator, metadataV2, lockV1 } = await loadFixture(upgradeToMetadataV2Fixture);

      const NeuV3 = await ethers.getContractFactory("NeuV3", upgrader);
      const neuAddress = await neuV2.getAddress();

      await expect(upgrades.upgradeProxy(neuAddress, NeuV3, {
        call: {
          fn: 'initializeV3',
          args: [
            operator.address as `0x${string}`,
            (await metadataV2.getAddress()) as `0x${string}`,
            (await lockV1.getAddress()) as `0x${string}`,
            traitMetadataUri,
          ],
        },
      })).to.be.revertedWith('Upgrade Metadata to V3 first');
    });

    it("Reverts when calling deprecated setStorageContract function", async function () {
      const { callNeuV3As, neuV3, storageV3, operator } = await loadFixture(upgradeToV3Fixture);

      await expect(callNeuV3As(operator).setStorageContract(await storageV3.getAddress() as `0x${string}`)).to.be.revertedWithCustomError(neuV3, 'Deprecated');
    });

    it("Gets proper royalty info after upgrade", async function () {
      const v2Params = await loadFixture(upgradeToNeuV2Fixture);

      const v2Results = await v2Params.callNeuV2As(v2Params.user).royaltyInfo(1n, 10n ** 9n);

      expect(v2Results[0]).to.equal(await v2Params.neuV2.getAddress() as `0x${string}`);
      expect(v2Results[1]).to.equal(10n ** 8n);

      const { user, operator, callNeuV3As } = await loadFixture(upgradeToV3Fixture);

      const [recipient, value] = await callNeuV3As(user).royaltyInfo(1n, 10n ** 9n);

      expect(recipient).to.equal(operator.address as `0x${string}`);
      expect(value).to.equal(10n ** 8n);
    });
  });

  describe("Metadata V3 upgrade", function () {
    it("Upgrades Metadata to V3", async function () {
      const { metadataV3 } = await loadFixture(upgradeToV3Fixture);

      expect(await metadataV3.getAddress()).to.be.properAddress;
    });

    it("Reverts if initializing V3 while there are refundable tokens", async function () {
      const { metadataV2, upgrader, user4, callNeuV2As } = await loadFixture(upgradeToMetadataV2Fixture);

      await expect(callNeuV2As(user4).burn(100004n)).not.to.be.reverted;

      const MetadataV3 = await ethers.getContractFactory("NeuMetadataV3", upgrader);
      const metadataAddress = await metadataV2.getAddress();

      await expect(upgrades.upgradeProxy(metadataAddress, MetadataV3, {
        call: {
          fn: 'initializeV3',
          args: [],
        },
      })).to.be.revertedWith('Refundable tokens exist');
    });

    it("Migrates available series to new data structure correctly", async function () {
      const { metadataV2, operator, upgrader, user4, callMetadataV2As, ogId } = await loadFixture(upgradeToMetadataV2Fixture);

      await time.increase(7 * day);

      await (await callMetadataV2As(operator).setSeriesAvailability(ogId, false)).wait();

      const availableSeriesV2 = await callMetadataV2As(user4).getAvailableSeries();

      const MetadataV3 = await ethers.getContractFactory("NeuMetadataV3", upgrader);
      const metadataAddress = await metadataV2.getAddress();

      const metadataV3 = await upgrades.upgradeProxy(metadataAddress, MetadataV3, {
        call: {
          fn: 'initializeV3',
          args: [],
        },
      });

      const availableSeriesV3 = await metadataV3.getAvailableSeries();

      expect(availableSeriesV3).to.have.lengthOf(availableSeriesV2.length);

      for (let i = 0; i < availableSeriesV2.length; i++) {
        expect(availableSeriesV3).to.include(availableSeriesV2[i]);
      }
    });

    it("Reverts on calling deprecated sumAllRefundableTokensValue function", async function () {
      const { callMetadataV3As, user } = await loadFixture(upgradeToV3Fixture);

      await expect(callMetadataV3As(user).sumAllRefundableTokensValue()).to.be.revertedWith('Deprecated on MetadataV3');
    });

    it("Reverts on calling deprecated createTokenMetadata function", async function () {
      const { callMetadataV3As, user } = await loadFixture(upgradeToV3Fixture);

      await expect(callMetadataV3As(user).createTokenMetadata(0n, 0n)).to.be.revertedWith('Deprecated on MetadataV3');
    });

    it("Reverts on calling deprecated getRefundAmount function", async function () {
      const { callNeuV3As, callMetadataV3As, user, wagmiId } = await loadFixture(upgradeToV3Fixture);

      const wagmi = await callMetadataV3As(user).getSeries(wagmiId);

      await expect(callNeuV3As(user).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).not.to.be.reverted;

      await expect(callMetadataV3As(user).getRefundAmount(100006n)).to.be.revertedWith('Token is not refundable');
      await expect(callMetadataV3As(user).getRefundAmount(100007n)).to.be.revertedWith('Token is not refundable');
      await expect(callMetadataV3As(user).getRefundAmount(42n)).to.be.revertedWith('Token is not refundable');
    });
  });

  describe("Storage V3 upgrade", function () {
    it("Upgrades Storage to V3", async function () {
      const { storageV3 } = await loadFixture(upgradeToV3Fixture);

      expect(await storageV3.getAddress()).to.be.properAddress;
    });

    it("Retrieves data correctly after upgrade", async function () {
      const { callStorageV3As, user, user2, user3, user4, user5 } = await loadFixture(upgradeToV3Fixture);

      expect(await callStorageV3As(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[1]);
      expect(await callStorageV3As(user2).retrieveData(user2.address as `0x${string}`)).to.equal(userDataHexArray[2]);
      expect(await callStorageV3As(user3).retrieveData(user3.address as `0x${string}`)).to.equal(userDataHexArray[3]);
      expect(await callStorageV3As(user4).retrieveData(user4.address as `0x${string}`)).to.equal(userDataHexArray[4]);
      expect(await callStorageV3As(user5).retrieveData(user5.address as `0x${string}`)).to.equal(userDataHexArray[5]);
    });

    it("Updates data correctly after upgrade", async function () {
      const { callStorageV3As, user, user2, user3, user4, user5 } = await loadFixture(upgradeToV3Fixture);

      await expect(callStorageV3As(user).saveData(100001n, userDataBytesArray[5])).not.to.be.reverted;
      await expect(callStorageV3As(user3).saveData(0n, userDataBytesArray[1])).not.to.be.reverted;
      await expect(callStorageV3As(user5).saveData(100001n, userDataBytesArray[3])).not.to.be.reverted;

      expect(await callStorageV3As(user).retrieveData(user.address as `0x${string}`)).to.equal(userDataHexArray[5]);
      expect(await callStorageV3As(user2).retrieveData(user2.address as `0x${string}`)).to.equal(userDataHexArray[2]);
      expect(await callStorageV3As(user3).retrieveData(user3.address as `0x${string}`)).to.equal(userDataHexArray[1]);
      expect(await callStorageV3As(user4).retrieveData(user4.address as `0x${string}`)).to.equal(userDataHexArray[4]);
      expect(await callStorageV3As(user5).retrieveData(user5.address as `0x${string}`)).to.equal(userDataHexArray[3]);
    });

  });

  describe("Entitlement V2 upgrade", function () {
    it("Upgrades Entitlement to V2", async function () {
      const { entitlementV2 } = await loadFixture(upgradeToV3Fixture);

      expect(await entitlementV2.getAddress()).to.be.properAddress;
    });

    it("Reverts when calling deprecated getter entitlementContracts", async function () {
      const { user, entitlementV2, neuV3 } = await loadFixture(upgradeToV3Fixture);

      const EntitlementV1 = await ethers.getContractFactory("NeuEntitlementV1", user);
      const entitlementV1 = EntitlementV1.attach(await entitlementV2.getAddress()) as NeuEntitlementV1;

      const userEntitlements = await entitlementV1.userEntitlementContracts(user.address as `0x${string}`);

      // Sanity check: can call V2 contract with entitlementV1 interface
      expect(userEntitlements).to.have.lengthOf(1);
      expect(userEntitlements[0]).to.equal(await neuV3.getAddress());

      // Revert when calling deprecated getter
      await expect(entitlementV1.entitlementContracts(0n)).to.be.reverted;
    });

    it("Storage remains consistent after upgrade", async function () {
      const { neuV3, unlockLock, callEntitlementV2As, user } = await loadFixture(upgradeToV3Fixture);

      expect(await callEntitlementV2As(user).entitlementContractsV2(0n)).to.equal(await neuV3.getAddress());
      expect(await callEntitlementV2As(user).entitlementContractsV2(1n)).to.equal(await unlockLock.getAddress());
      await expect(callEntitlementV2As(user).entitlementContractsV2(2n)).to.be.revertedWithPanic();
    });
  });
});