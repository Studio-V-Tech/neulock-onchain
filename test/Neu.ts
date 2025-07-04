import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseContract, ContractTransactionResponse } from "ethers";

import { TokenMetadata, day, seriesValue, getRoles, validateTokenMetadataCommonAttributes, parseSponsorPointsResponse, pointsTrait } from "../scripts/lib/utils";
import { deployContractsFixture, setSeriesFixture, purchasedTokensFixture, setUserDataFixture } from "./lib/fixtures";
import { accessControlTestFactory, AccessControlSupportedContracts } from "./lib/AccessControl";

interface NeuIncreaseBalance extends BaseContract {
  increaseBalance(address: `0x${string}`, value: bigint): Promise<ContractTransactionResponse>;
}

describe("Neu", function () {
  describe("Deployment", function () {
    it("Deploys", async function () {
      const { neu } = await loadFixture(deployContractsFixture);

      expect(await neu.getAddress()).to.be.properAddress;
    });
  });

  describe("Public minting", function () {
    it("Mints token correctly", async function () {
      const { user, callNeuAs, callMetadataAs, wagmiId } = await loadFixture(setSeriesFixture);

      const userAddress = user.address as `0x${string}`;
      const wagmi = await callMetadataAs(user).getSeries(wagmiId);

      await (await callNeuAs(user).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

      const balance = await callNeuAs(user).balanceOf(userAddress);
      const owner = await callNeuAs(user).ownerOf(100001n);

      expect(balance).to.equal(1);
      expect(owner).to.equal(userAddress);
    });

    it("Reverts on minting from non-existent series", async function () {
      const { user, callNeuAs } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(user).safeMintPublic(42n, { value: 42n })).to.be.revertedWith(
        "Public minting not available");
    });

    it("Reverts on minting from non-available series", async function () {
      const { user, callNeuAs, callMetadataAs, ogId } = await loadFixture(setSeriesFixture);

      const og = await callMetadataAs(user).getSeries(ogId);

      await expect(callNeuAs(user).safeMintPublic(ogId, { value: seriesValue(og) })).to.be.revertedWith(
        "Public minting not available");
    });

    it("Reverts on minting from sold-out series", async function () {
      const { operator, user, callNeuAs, uniqueId } = await loadFixture(setSeriesFixture);

      await expect(callNeuAs(user).safeMintPublic(uniqueId, { value: 10n ** 9n })).not.to.be.reverted;
      await expect(callNeuAs(user).safeMintPublic(uniqueId, { value: 10n ** 9n })).to.be.revertedWith(
        "Public minting not available");
    });

    it("Reverts on minting with insufficient value", async function () {
      const { user, callNeuAs, wagmiId } = await loadFixture(setSeriesFixture);

      await expect(callNeuAs(user).safeMintPublic(wagmiId, { value: 42n })).to.be.revertedWith(
        "Not enough ETH sent");
    });
  });

  describe("Private minting", function () {
    it("Mints token correctly to specific address", async function () {
      const { operator, user, callNeuAs, callMetadataAs, ogId } = await loadFixture(setSeriesFixture);

      const userAddress = user.address as `0x${string}`;

      await (await callNeuAs(operator).safeMint(user.address, ogId)).wait();

      const balance = await callNeuAs(user).balanceOf(userAddress);
      const owner = await callNeuAs(user).ownerOf(1n);
      const og = await callMetadataAs(user).getSeries(ogId);

      expect(balance).to.equal(1);
      expect(owner).to.equal(userAddress);
      expect(og.mintedTokens).to.equal(1);
    });

    it("Mints token from series not available for public minting", async function () {
      const { operator, user, callNeuAs, callMetadataAs, ogId } = await loadFixture(setSeriesFixture);

      const userAddress = user.address as `0x${string}`;

      await (await callNeuAs(operator).safeMint(user.address, ogId)).wait();

      const balance = await callNeuAs(user).balanceOf(userAddress);
      const owner = await callNeuAs(user).ownerOf(1n);
      const og = await callMetadataAs(user).getSeries(ogId);

      expect(balance).to.equal(1);
      expect(owner).to.equal(userAddress);
      expect(og.mintedTokens).to.equal(1);
    });

    it("Reverts on private minting for non-operator", async function () {
      const { user, callNeuAs, wagmiId } = await loadFixture(setSeriesFixture);

      await expect(callNeuAs(user).safeMint(user.address, wagmiId)).to.be.reverted;
    });

    it("Reverts on private minting from non-existent series", async function () {
      const { operator, callNeuAs } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(operator).safeMint(operator.address, 42n)).to.be.revertedWith("Invalid series index");
    });

    it("Reverts on private minting from a sold-out series", async function () {
      const { operator, callNeuAs, uniqueId } = await loadFixture(setSeriesFixture);

      await expect(callNeuAs(operator).safeMint(operator.address, uniqueId)).to.not.be.reverted;
      await expect(callNeuAs(operator).safeMint(operator.address, uniqueId)).to.be.revertedWith(
        "Series has been fully minted");
    });
  });

  describe("Owned tokens", function () {
    it("Gets token IDs for all tokens owned by user with no balance", async function () {
      const { admin, user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(admin.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(0);
    });

    it("Gets token IDs for all tokens owned by user with balance of one self-minted token", async function () {
      const { user, user4, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(user4.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(1);
      expect(tokenIds[0]).to.equal(100004n);
    });

    it("Gets token IDs for all tokens owned by user with balance of four self-minted tokens", async function () {
      const { user, user3, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(user3.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(4);
      expect([...tokenIds]).to.have.members([3n, 4n, 100002n, 100003n]);
    });

    it("Gets token IDs for all tokens owned by user with balance of two private-minted tokens", async function () {
      const { user, user5, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(user5.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(2);
      expect([...tokenIds]).to.have.members([5n, 100005n]);
    });
  });

  describe("Burn", function () {
    it("Burns token correctly", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const userAddress = user.address as `0x${string}`;

      const previousBalance = await callNeuAs(user).balanceOf(userAddress);
      await (await callNeuAs(user).burn(100001n)).wait();

      const currentBalance = await callNeuAs(user).balanceOf(userAddress);

      expect(previousBalance - currentBalance).to.equal(1);
    });

    it("Reverts on burning non-existent token", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user).burn(42n)).to.be.reverted;
    });

    it("Reverts on burning token owned by someone else", async function () {
      const { user, operator, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user).burn(1n)).to.be.reverted;
      await expect(callNeuAs(operator).burn(100001n)).to.be.reverted;
    });
  });

  describe("Withdraw", function () {
    it("Withdraws correctly", async function () {
      const { operator, callNeuAs, callMetadataAs, wagmiId, ogId } = await loadFixture(purchasedTokensFixture);

      await time.increase(7 * day);

      const wagmi = await callMetadataAs(operator).getSeries(wagmiId);
      const og = await callMetadataAs(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuAs(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + 4n * seriesValue(wagmi).valueOf() + 4n * seriesValue(og).valueOf() - gas);
    });

    it("Withdraws nothing if contract has no balance", async function () {
      const { operator, callNeuAs } = await loadFixture(deployContractsFixture);

      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuAs(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(balanceBefore - gas);
    });

    it("Reverts on non-operator withdraw", async function () {
      const { user, callNeuAs: callNeuAs } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(user).withdraw()).to.be.reverted;
    });
  });

  describe("Token metadata", function () {
    it("Reverts on setting metadata contract when already set", async function () {
      const { operator, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(operator).setMetadataContract(operator.address as `0x${string}`)).to.be.revertedWith("Metadata contract already set");
    });

    it("Gets token metadata correctly", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const ogTokenURIBase64 = await callNeuAs(user).tokenURI(1n);
      const ogTokenMetadata: TokenMetadata = JSON.parse(Buffer.from(ogTokenURIBase64.split(",")[1], "base64").toString("utf-8"));

      const wagmiTokenURIBase64 = await callNeuAs(user).tokenURI(100002n);
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

    it("Gets metadata and user minted status for all tokens owned by user with no balance", async function () {
      const { admin, user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(admin.address as `0x${string}`);

      expect(tokenIds).to.be.an("array").with.lengthOf(0);

      const { tokenUris, isUserMinted } = await callNeuAs(user).getTokensWithData([...tokenIds]);

      expect(tokenUris).to.be.an("array").with.lengthOf(0);
      expect(isUserMinted).to.be.an("array").with.lengthOf(0);
    });

    it("Gets metadata and user minted status for all tokens owned by user with balance of one self-minted token", async function () {
      const { user, user4, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(user4.address as `0x${string}`);

      const { tokenUris, isUserMinted } = await callNeuAs(user).getTokensWithData([...tokenIds]);

      expect(tokenUris).to.be.an("array").with.lengthOf(1);

      const wagmiTokenMetadata: TokenMetadata = JSON.parse(Buffer.from(tokenUris[0].split(",")[1], "base64").toString("utf-8"));

      validateTokenMetadataCommonAttributes(wagmiTokenMetadata);

      expect(wagmiTokenMetadata.name).to.equal("NEU #100004 WAGMI1");
      expect(wagmiTokenMetadata.attributes[0].value).to.equal("WAGMI1");
      expect(wagmiTokenMetadata.attributes[1].value).to.equal("No");
      expect(wagmiTokenMetadata.attributes[2].value).to.equal(1000);

      expect(isUserMinted).to.be.an("array").with.lengthOf(1);
      expect(isUserMinted[0]).to.be.true;
    });

    it("Gets metadata and user minted status for all tokens owned by user with balance of four self-minted tokens", async function () {
      const { user, user3, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(user3.address as `0x${string}`);
      const { tokenUris, isUserMinted } = await callNeuAs(user).getTokensWithData([...tokenIds]);

      expect(tokenUris).to.be.an("array").with.lengthOf(4);
      expect(isUserMinted).to.be.an("array").with.lengthOf(4);

      for (const isMinted of isUserMinted) {
        expect(isMinted).to.be.true;
      }
    });

    it("Gets metadata and user minted status for all tokens owned by user with balance of two private-minted tokens", async function () {
      const { user, user5, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const tokenIds = await callNeuAs(user).getTokensOfOwner(user5.address as `0x${string}`);
      const { tokenUris, isUserMinted } = await callNeuAs(user).getTokensWithData([...tokenIds]);

      expect(tokenUris).to.be.an("array").with.lengthOf(2);
      expect(isUserMinted).to.be.an("array").with.lengthOf(2);

      for (const isMinted of isUserMinted) {
        expect(isMinted).to.be.false;
      }
    });

  });

  describe("Dynamic traits", function () {
    it("Gets dynamic trait correctly", async function () {
      const { user, callNeuAs } = await loadFixture(setUserDataFixture);

      const token100001TraitBytes = await callNeuAs(user).getTraitValue(100001n, pointsTrait);
      const token2TraitBytes = await callNeuAs(user).getTraitValue(2n, pointsTrait);
      const token3TraitBytes = await callNeuAs(user).getTraitValue(3n, pointsTrait);
      const token100004TraitBytes = await callNeuAs(user).getTraitValue(100004n, pointsTrait);
      const token5TraitBytes = await callNeuAs(user).getTraitValue(5n, pointsTrait);

      expect(parseSponsorPointsResponse(token100001TraitBytes)).to.equal(0);
      expect(parseSponsorPointsResponse(token2TraitBytes)).to.equal(1);
      expect(parseSponsorPointsResponse(token3TraitBytes)).to.equal(100);
      expect(parseSponsorPointsResponse(token100004TraitBytes)).to.equal(10_000);
      expect(parseSponsorPointsResponse(token5TraitBytes)).to.equal(9_000_000);
    });

    it("Gets multiple dynamic traits correctly", async function () {
      const { user, callNeuAs } = await loadFixture(setUserDataFixture);

      const tokenTraitBytes = await callNeuAs(user).getTraitValues(3n, [pointsTrait]);

      const tokenTrait = tokenTraitBytes.map((trait) => parseSponsorPointsResponse(trait));

      expect(tokenTrait[0]).to.equal(100);
    });

    it("Gets multiple dynamic traits correctly for multiple tokens", async function () {
      const { user, callNeuAs } = await loadFixture(setUserDataFixture);

      const [ogTokenTraitBytes, wagmiTokenTraitBytes] = await callNeuAs(user).getTokensTraitValues([3n, 100003n], [pointsTrait]);

      const ogTokenTrait = ogTokenTraitBytes.map((trait) => parseSponsorPointsResponse(trait));
      const wagmiTokenTrait = wagmiTokenTraitBytes.map((trait) => parseSponsorPointsResponse(trait));

      expect(ogTokenTrait).to.be.an("array").with.lengthOf(1);
      expect(ogTokenTrait[0]).to.equal(100);

      expect(wagmiTokenTrait).to.be.an("array").with.lengthOf(1);
      expect(wagmiTokenTrait[0]).to.equal(0);
    });

    it("Reverts on trying to set dynamic trait", async function () {
      const { operator, callNeuAs, neu } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(operator).setTrait(1n, pointsTrait, `0x${"0".repeat(64)}`)).to.be.revertedWithCustomError(neu, "TraitValueUnchanged");
    });

    it("Updates dynamic trait correctly", async function () {
      const { user, user2, user3, user4, user5, callNeuAs, callStorageAs } = await loadFixture(setUserDataFixture);

      const dummyData = new Uint8Array(32);

      await (await callStorageAs(user).saveData(100001n, dummyData, { value: 10n ** 15n })).wait();
      await (await callStorageAs(user2).saveData(2n, dummyData, { value: 3n * 10n ** 14n })).wait();
      await (await callStorageAs(user3).saveData(3n, dummyData, { value: 10n ** 16n })).wait();
      await (await callStorageAs(user4).saveData(100004n, dummyData, { value: 10n ** 14n })).wait();
      await (await callStorageAs(user5).saveData(5n, dummyData, { value: 9n * 10n ** 20n })).wait();

      const token100001TraitBytes = await callNeuAs(user).getTraitValue(100001n, pointsTrait);
      const token2TraitBytes = await callNeuAs(user).getTraitValue(2n, pointsTrait);
      const token3TraitBytes = await callNeuAs(user).getTraitValue(3n, pointsTrait);
      const token100004TraitBytes = await callNeuAs(user).getTraitValue(100004n, pointsTrait);
      const token5TraitBytes = await callNeuAs(user).getTraitValue(5n, pointsTrait);

      expect(parseSponsorPointsResponse(token100001TraitBytes)).to.equal(10);
      expect(parseSponsorPointsResponse(token2TraitBytes)).to.equal(4);
      expect(parseSponsorPointsResponse(token3TraitBytes)).to.equal(200);
      expect(parseSponsorPointsResponse(token100004TraitBytes)).to.equal(10_001);
      expect(parseSponsorPointsResponse(token5TraitBytes)).to.equal(18_000_000);
    });

    it("Gets wei per sponsor point correctly", async function () {
      const { user, callNeuAs } = await loadFixture(deployContractsFixture);

      const weiPerSponsorPoint = await callNeuAs(user).weiPerSponsorPoint();

      expect(weiPerSponsorPoint).to.equal(10n ** 14n);
    });

    it("Sets wei per sponsor point correctly", async function () {
      const { operator, user, callNeuAs } = await loadFixture(deployContractsFixture);

      await (await callNeuAs(operator).setWeiPerSponsorPoint(42n * 10n ** 9n)).wait();

      const weiPerSponsorPoint = await callNeuAs(user).weiPerSponsorPoint();

      expect(weiPerSponsorPoint).to.equal(42n * 10n ** 9n);
    });

    it("Obeys new wei per sponsor point", async function () {
      const { operator, user2, callNeuAs, callStorageAs } = await loadFixture(setUserDataFixture);

      await (await callNeuAs(operator).setWeiPerSponsorPoint(2n * 10n ** 14n)).wait();
      await (await callStorageAs(user2).saveData(2n, new Uint8Array(32), { value: 4n * 10n ** 14n })).wait();

      const token100001TraitBytes = await callNeuAs(user2).getTraitValue(2n, pointsTrait);

      expect(parseSponsorPointsResponse(token100001TraitBytes)).to.equal(3);
    });

    it("Reverts on setting wei per sponsor point less than 1 gwei", async function () {
      const { operator, callNeuAs } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(operator).setWeiPerSponsorPoint(0n)).to.be.revertedWith("Must be at least 1 gwei");
      await expect(callNeuAs(operator).setWeiPerSponsorPoint(42n)).to.be.revertedWith("Must be at least 1 gwei");
      await expect(callNeuAs(operator).setWeiPerSponsorPoint(10n ** 9n - 1n)).to.be.revertedWith("Must be at least 1 gwei");
      await expect(callNeuAs(operator).setWeiPerSponsorPoint(10n ** 9n)).not.to.be.reverted;
    });

    it("Reverts on setting wei per sponsor point for non-operators", async function () {
      const { user, callNeuAs } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(user).setWeiPerSponsorPoint(42n * 10n ** 9n)).to.be.reverted;
    });

    it("Gets trait metadata URI correctly", async function () {
      const { user, callNeuAs } = await loadFixture(deployContractsFixture);

      const uri = await callNeuAs(user).getTraitMetadataURI();

      expect(uri).to.equal("data:application/json;base64,eyJ0cmFpdHMiOnsicG9pbnRzIjp7ImRpc3BsYXlOYW1lIjoiU3BvbnNvciBQb2ludHMiLCJkYXRhVHlwZSI6eyJ0eXBlIjoiZGVjaW1hbCJ9LCJ2YWxpZGF0ZU9uU2FsZSI6InJlcXVpcmVVaW50R3RlIn19fQ==");
    });

    it("Sets trait metadata URI correctly", async function () {
      const { operator, callNeuAs } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(operator).setTraitMetadataURI("https://example.com"))
        .to.emit(callNeuAs(operator), "TraitMetadataURIUpdated");

      const uri = await callNeuAs(operator).getTraitMetadataURI();

      expect(uri).to.equal("https://example.com");
    });

    it("Reverts on setting trait metadata URI for non-operators", async function () {
      const { user, callNeuAs } = await loadFixture(deployContractsFixture);

      await expect(callNeuAs(user).setTraitMetadataURI("https://example.com")).to.be.reverted;
    });
  });

  describe("Royalty", function () {
    it("Gets proper royalty info", async function () {
      const { user, operator, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const [recipient, value] = await callNeuAs(user).royaltyInfo(1n, 10n ** 9n);

      expect(recipient).to.equal(operator.address as `0x${string}`);
      expect(value).to.equal(10n ** 8n);
    });

    it("Sets royalty receiver", async function () {
      const { neu, user, operator, admin, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const [oldRecipient, oldValue] = await callNeuAs(user).royaltyInfo(1n, 10n ** 9n);

      expect(oldRecipient).to.equal(operator.address as `0x${string}`);
      expect(oldValue).to.equal(10n ** 8n);

      await expect(callNeuAs(operator).setRoyaltyReceiver(admin.address as `0x${string}`)).to.emit(neu, "RoyaltyReceiverUpdated").withArgs(admin.address as `0x${string}`);

      const [newRecipient, newValue] = await callNeuAs(user).royaltyInfo(1n, 10n ** 9n);

      expect(newRecipient).to.equal(admin.address as `0x${string}`);
      expect(newValue).to.equal(10n ** 8n);
    });

    it("Reverts on setting royalty receiver for non-operators", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user).setRoyaltyReceiver(user.address as `0x${string}`)).to.be.reverted;
    });
  });

  describe("Entitlement", function () {
    it("Keeps entitlement after timestamp at zero upon minting", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const entitlementAfterTimestamp = await callNeuAs(user).entitlementAfterTimestamps(1n);

      expect(entitlementAfterTimestamp).to.equal(0n);
    });

    it("Sets entitlement after timestamp correctly after first transfer", async function () {
      const { user, user2, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await (await callNeuAs(user2).transferFrom(user2.address as `0x${string}`, user.address as `0x${string}`, 1n)).wait();

      const timestamp = (await ethers.provider.getBlock("latest"))?.timestamp ?? 42;

      const entitlementAfterTimestamp = await callNeuAs(user2).entitlementAfterTimestamps(1n);

      expect(entitlementAfterTimestamp).to.equal(BigInt(timestamp + 1));
    });

    it("Sets entitlement after timestamp correctly after transfer less than a week after start of entitlement", async function () {
      const { user, user2, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await (await callNeuAs(user2).transferFrom(user2.address as `0x${string}`, user.address as `0x${string}`, 1n)).wait();
      const firstTransferTimestamp = (await ethers.provider.getBlock("latest"))?.timestamp ?? 42;

      await time.increase(day);

      await (await callNeuAs(user).transferFrom(user.address as `0x${string}`, user2.address as `0x${string}`, 1n)).wait();

      const entitlementAfterTimestamp = await callNeuAs(user2).entitlementAfterTimestamps(1n);

      expect(entitlementAfterTimestamp).to.equal(BigInt(firstTransferTimestamp + 7 * day + 1));
    });

    it("Sets entitlement after timestamp correctly after transfer exactly a week after start of entitlement", async function () {
      const { user, user2, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await (await callNeuAs(user2).transferFrom(user2.address as `0x${string}`, user.address as `0x${string}`, 1n)).wait();

      await time.increase(7 * day);

      await (await callNeuAs(user).transferFrom(user.address as `0x${string}`, user2.address as `0x${string}`, 1n)).wait();
      const timestamp = (await ethers.provider.getBlock("latest"))?.timestamp ?? 42;

      const entitlementAfterTimestamp = await callNeuAs(user2).entitlementAfterTimestamps(1n);

      expect(entitlementAfterTimestamp).to.equal(BigInt(timestamp + 1));
    });

    it("Sets entitlement after timestamp correctly after transfer more than a week after start of entitlement", async function () {
      const { user, user2, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await (await callNeuAs(user2).transferFrom(user2.address as `0x${string}`, user.address as `0x${string}`, 1n)).wait();

      await time.increase(30 * day);

      await (await callNeuAs(user).transferFrom(user.address as `0x${string}`, user2.address as `0x${string}`, 1n)).wait();
      const timestamp = (await ethers.provider.getBlock("latest"))?.timestamp ?? 42;

      const entitlementAfterTimestamp = await callNeuAs(user2).entitlementAfterTimestamps(1n);

      expect(entitlementAfterTimestamp).to.equal(BigInt(timestamp + 1));
    });
  });

  describe("DAO Lock", function () {
    it("Sets DAO Lock contract", async function () {
      const { neu, operator, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(operator).setDaoLockContract(operator.address as `0x${string}`)).to.emit(neu, "DaoLockContractUpdated").withArgs(operator.address as `0x${string}`);
    });

    it("Reverts on setting DAO Lock contract for non-operators", async function () {
      const { neu, user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user).setDaoLockContract(user.address as `0x${string}`)).to.be.reverted;
    });
    
  });

  describe("Increase balance test (not covered otherwise)", function () {
    it("Reverts on calling _increaseBalance", async function () {
      const { operator } = await loadFixture(deployContractsFixture);

      const NeuIncreaseBalance = await ethers.getContractFactory("NeuIncreaseBalance");
      const neuIncreaseBalance = await NeuIncreaseBalance.deploy();
      await neuIncreaseBalance.waitForDeployment();

      await expect((neuIncreaseBalance.connect(operator) as NeuIncreaseBalance).increaseBalance(operator.address as `0x${string}`, 42n)).to.be.revertedWithCustomError(neuIncreaseBalance, "ERC721EnumerableForbiddenBatchMint");
    });
  });

  describe("Access control specifics", function () {
    it("Obeys new roles in withdrawal calls", async function () {
      const { callNeuAs, admin, operator, user } = await loadFixture(deployContractsFixture);
      const { operatorRole } = getRoles();

      await (await callNeuAs(admin).grantRole(operatorRole, user.address as `0x${string}`)).wait();
      await (await callNeuAs(admin).revokeRole(operatorRole, operator.address as `0x${string}`)).wait();

      await expect(callNeuAs(operator).withdraw()).to.be.reverted;
      await expect(callNeuAs(user).withdraw()).not.to.be.reverted;
    });
  });

  describe("Access control", accessControlTestFactory(AccessControlSupportedContracts.Neu));
});
