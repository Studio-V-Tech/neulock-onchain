import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseContract, ContractTransactionResponse } from "ethers";

import { TokenMetadata, day, stringToBytes, seriesValue, getRoles, validateTokenMetadataCommonAttributes, parseSponsorPointsResponse, pointsTrait } from "../scripts/lib/utils";
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

    it("Withdraws nothing during refund window", async function () {
      const { operator, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuAs(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(balanceBefore - gas);
    });

    it("Withdraws only value of tokens older than refund window", async function () {
      const { operator, callNeuAs, callMetadataAs, wagmiId, ogId } = await loadFixture(purchasedTokensFixture);

      await time.increase(3 * day);

      const wagmi = await callMetadataAs(operator).getSeries(wagmiId);
      const og = await callMetadataAs(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuAs(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + 2n * seriesValue(wagmi).valueOf() + 1n * seriesValue(og).valueOf() - gas);
    });

    it("Withdraws only non-refunded tokens", async function () {
      const { operator, user3, callNeuAs, callMetadataAs, wagmiId, ogId } = await loadFixture(purchasedTokensFixture);

      await (await callNeuAs(user3).refund(3n)).wait();
      await (await callNeuAs(user3).refund(100003n)).wait();

      await time.increase(7 * day);

      const wagmi = await callMetadataAs(operator).getSeries(wagmiId);
      const og = await callMetadataAs(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuAs(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + 3n * seriesValue(wagmi).valueOf() + 3n * seriesValue(og).valueOf() - gas);
    });

    it("Withdraws once per token", async function () {
      const { operator, callNeuAs, callMetadataAs, wagmiId, ogId } = await loadFixture(purchasedTokensFixture);

      const wagmi = await callMetadataAs(operator).getSeries(wagmiId);
      const og = await callMetadataAs(operator).getSeries(ogId);

      await time.increase(3 * day);
      await (await callNeuAs(operator).withdraw()).wait();
      await time.increase(day);

      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuAs(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(balanceBefore + seriesValue(wagmi).valueOf() + seriesValue(og).valueOf() - gas);
    });

    it("Withdraws with value of token burned during refund window", async function () {
      const { operator, user3, callNeuAs, callMetadataAs, wagmiId, ogId } = await loadFixture(purchasedTokensFixture);

      await (await callNeuAs(user3).burn(3n)).wait();

      const og = await callMetadataAs(operator).getSeries(ogId);
      const balanceBefore = await ethers.provider.getBalance(operator.address);

      const withdrawalReceipt = await (await callNeuAs(operator).withdraw()).wait();
      const gas = withdrawalReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(operator.address);

      expect(balanceAfter).to.equal(
        balanceBefore + seriesValue(og).valueOf() - gas);
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

  describe("Refund", function () {
    it("Refunds correctly", async function () {
      const { user, callNeuAs, callMetadataAs, wagmiId } = await loadFixture(purchasedTokensFixture);

      const wagmi = await callMetadataAs(user).getSeries(wagmiId);
      const balanceBefore = await ethers.provider.getBalance(user.address);

      const refundReceipt = await (await callNeuAs(user).refund(100001n)).wait();
      const gas = refundReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(user.address);

      expect(balanceAfter).to.equal(balanceBefore + seriesValue(wagmi).valueOf() - gas);
    });

    it("Refunds original value after series price change", async function () {
      const { user, operator, callNeuAs, callMetadataAs, wagmiId } = await loadFixture(purchasedTokensFixture);

      const wagmi = await callMetadataAs(user).getSeries(wagmiId);
      const originalValue = seriesValue(wagmi).valueOf();
      const balanceBefore = await ethers.provider.getBalance(user.address);

      await (await callMetadataAs(operator).setPriceInGwei(wagmiId, 42n)).wait();

      const refundReceipt = await (await callNeuAs(user).refund(100001n)).wait();
      const gas = refundReceipt!.fee;

      const balanceAfter = await ethers.provider.getBalance(user.address);

      expect(balanceAfter).to.equal(balanceBefore + originalValue - gas);
    });

    it("Burns token after refund", async function () {
      const { user2, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const user2Address = user2.address as `0x${string}`;
      const supplyBefore = await callNeuAs(user2).totalSupply();
      const balanceBefore = await callNeuAs(user2).balanceOf(user2Address);
      const ownerBefore = await callNeuAs(user2).ownerOf(2n);

      await (await callNeuAs(user2).refund(2n)).wait();

      const supplyAfter = await callNeuAs(user2).totalSupply();
      const balanceAfter = await callNeuAs(user2).balanceOf(user2Address);

      expect(ownerBefore).to.equal(user2Address);
      expect(supplyAfter).to.equal(supplyBefore.valueOf() - 1n)
      expect(balanceAfter).to.equal(balanceBefore.valueOf() - 1n)
      await expect(callNeuAs(user2).ownerOf(2n)).to.be.reverted;
    });

    it("Refunds token only once", async function () {
      const { user2, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user2).refund(2n)).not.to.be.reverted;
      await expect(callNeuAs(user2).refund(2n)).to.be.reverted;
    });

    it("Reverts on refunding non-existent token", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user).refund(42n)).to.be.reverted;
    });

    it("Reverts on refunding token owned by someone else", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user).refund(2n)).to.be.revertedWith("Caller is not token owner");
    });

    it("Reverts on refunding non-refundable token", async function () {
      const { user5, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await expect(callNeuAs(user5).refund(5n)).to.be.revertedWith("Token is not refundable");
      await expect(callNeuAs(user5).refund(100005n)).to.be.revertedWith("Token is not refundable");
    });

    it("Reverts on refunding after refund window", async function () {
      const { user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      await time.increase(2 * day);

      await expect(callNeuAs(user).refund(100001n)).to.be.revertedWith("Refund window has passed");
    });
  });

  describe("Token metadata", function () {
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
      expect(parseSponsorPointsResponse(token2TraitBytes)).to.equal(1338);
      expect(parseSponsorPointsResponse(token3TraitBytes)).to.equal(1437);
      expect(parseSponsorPointsResponse(token100004TraitBytes)).to.equal(10_000);
      expect(parseSponsorPointsResponse(token5TraitBytes)).to.equal(9_000_000);
    });

    it("Gets multiple dynamic traits correctly", async function () {
      const { user, callNeuAs } = await loadFixture(setUserDataFixture);

      const tokenTraitBytes = await callNeuAs(user).getTraitValues(3n, [pointsTrait]);

      const tokenTrait = tokenTraitBytes.map((trait) => parseSponsorPointsResponse(trait));

      expect(tokenTrait[0]).to.equal(1437);
    });

    it("Gets multiple dynamic traits correctly for multiple tokens", async function () {
      const { user, callNeuAs } = await loadFixture(setUserDataFixture);

      const [ogTokenTraitBytes, wagmiTokenTraitBytes] = await callNeuAs(user).getTokensTraitValues([3n, 100003n], [pointsTrait]);

      const ogTokenTrait = ogTokenTraitBytes.map((trait) => parseSponsorPointsResponse(trait));
      const wagmiTokenTrait = wagmiTokenTraitBytes.map((trait) => parseSponsorPointsResponse(trait));

      expect(ogTokenTrait).to.be.an("array").with.lengthOf(1);
      expect(ogTokenTrait[0]).to.equal(1437);

      expect(wagmiTokenTrait).to.be.an("array").with.lengthOf(1);
      expect(wagmiTokenTrait[0]).to.equal(0);
    });

    it("Reverts on trying to set dynamic trait", async function () {
      const { operator, callNeuAs } = await loadFixture(deployContractsFixture);

      const pointsTrait = stringToBytes("points", 32);

      await expect(callNeuAs(operator).setTrait(1n, pointsTrait, new Uint8Array(32))).to.be.revertedWith("Trait cannot be set");
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
      expect(parseSponsorPointsResponse(token2TraitBytes)).to.equal(1341);
      expect(parseSponsorPointsResponse(token3TraitBytes)).to.equal(1537);
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

      expect(parseSponsorPointsResponse(token100001TraitBytes)).to.equal(1340);
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
  });

  describe("Royalty", function () {
    it("Gets proper royalty info", async function () {
      const { neu, user, callNeuAs } = await loadFixture(purchasedTokensFixture);

      const [recipient, value] = await callNeuAs(user).royaltyInfo(1n, 10n ** 9n);

      expect(recipient).to.equal(await neu.getAddress());
      expect(value).to.equal(10n ** 8n);
    });
  });

  describe("Increase balance test (not covered otherwise)", function () {
    it("Reverts on calling _increaseBalance", async function () {
      const { operator, callNeuAs } = await loadFixture(deployContractsFixture);

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
