import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { TokenMetadata, stringToBytes, bytesToString, getRoles, validateTokenMetadataCommonAttributes, validateSvg } from "../scripts/lib/utils";
import { deployContractsFixture, setSeriesFixture, purchasedTokensFixture } from "./lib/fixtures";
import { accessControlTestFactory, AccessControlSupportedContracts } from "./lib/AccessControl";

describe("Metadata", function () {
  describe("Deployment", function () {
    it("Deploys", async function () {
      const { metadata } = await loadFixture(deployContractsFixture);

      expect(await metadata.getAddress()).to.be.properAddress;
    });
  });

  describe("Series", function () {
    it("Defines three series correctly", async function () {
      const { user, callMetadataAs, wagmiId, ogId, uniqueId } = await loadFixture(setSeriesFixture);

      const wagmi = await callMetadataAs(user).getSeries(wagmiId);
      const og = await callMetadataAs(user).getSeries(ogId);
      const unique = await callMetadataAs(user).getSeries(uniqueId);

      expect(bytesToString(wagmi.name)).to.equal("WAGMI1");
      expect(wagmi.priceInGwei).to.equal(1337n * 10n ** 4n);
      expect(wagmi.firstToken).to.equal(100001);
      expect(wagmi.maxTokens).to.equal(1000);
      expect(wagmi.mintedTokens).to.equal(0);
      expect(wagmi.burntTokens).to.equal(0);
      expect(wagmi.isAvailable).to.be.true;
      validateSvg(wagmi.logoSvg);

      expect(bytesToString(og.name)).to.equal("OG1");
      expect(og.priceInGwei).to.equal(1337n * 10n ** 5n);
      expect(og.firstToken).to.equal(1);
      expect(og.maxTokens).to.equal(100);
      expect(og.mintedTokens).to.equal(0);
      expect(og.burntTokens).to.equal(0);
      expect(og.isAvailable).to.be.false;
      validateSvg(og.logoSvg);

      expect(bytesToString(unique.name)).to.equal("UNIQUE");
      expect(unique.priceInGwei).to.equal(1);
      expect(unique.firstToken).to.equal(101);
      expect(unique.maxTokens).to.equal(1);
      expect(unique.mintedTokens).to.equal(0);
      expect(unique.burntTokens).to.equal(0);
      expect(unique.isAvailable).to.be.true;
      validateSvg(unique.logoSvg);
    });

    it("Gets series availability correctly", async function () {
      const { user, callMetadataAs, wagmiId, ogId, uniqueId } = await loadFixture(setSeriesFixture);

      expect(await callMetadataAs(user).isSeriesAvailable(wagmiId)).to.be.true;
      expect(await callMetadataAs(user).isSeriesAvailable(ogId)).to.be.false;
      expect(await callMetadataAs(user).isSeriesAvailable(uniqueId)).to.be.true;
      expect(await callMetadataAs(user).isSeriesAvailable(42n)).to.be.false;
    });

    it("Sets minted count correctly", async function () {
      const { user, callMetadataAs, wagmiId, ogId, uniqueId } = await loadFixture(purchasedTokensFixture);

      const wagmi = await callMetadataAs(user).getSeries(wagmiId);
      const og = await callMetadataAs(user).getSeries(ogId);
      const unique = await callMetadataAs(user).getSeries(uniqueId);

      expect(wagmi.mintedTokens).to.equal(5);
      expect(og.mintedTokens).to.equal(5);
      expect(unique.mintedTokens).to.equal(0);
    });

    it("Sets burnt count correctly", async function () {
      const { user, user2, user3, user5, callMetadataAs, callNeuAs, wagmiId, ogId, uniqueId } = await loadFixture(purchasedTokensFixture);

      await (await callNeuAs(user).burn(100001n)).wait();
      await (await callNeuAs(user2).burn(1n)).wait();
      await (await callNeuAs(user3).refund(100002n)).wait();
      await (await callNeuAs(user3).refund(3n)).wait();
      await (await callNeuAs(user5).burn(5n)).wait();

      const wagmi = await callMetadataAs(user).getSeries(wagmiId);
      const og = await callMetadataAs(user).getSeries(ogId);
      const unique = await callMetadataAs(user).getSeries(uniqueId);

      expect(wagmi.burntTokens).to.equal(2);
      expect(og.burntTokens).to.equal(3);
      expect(unique.burntTokens).to.equal(0);
    });

    it("Reverts when adding series with existing name", async function () {
      const { operator, callMetadataAs } = await loadFixture(setSeriesFixture);

      await expect(callMetadataAs(operator).addSeries(stringToBytes('WAGMI1'), 1337n * 10n ** 4n, 200000n, 1000n, 1000n, 1000n, 1000n, true)).to.be.revertedWith("Series name already exists");
    });

    it("Reverts when adding series overlapping with existing one", async function () {
      const { operator, callMetadataAs } = await loadFixture(setSeriesFixture);

      await expect(callMetadataAs(operator).addSeries(stringToBytes('WAGMIOVL'), 1337n * 10n ** 4n, 100001n, 1000n, 1000n, 1000n, 1000n, true)).to.be.revertedWith( "Series overlaps with existing");
      await expect(callMetadataAs(operator).addSeries(stringToBytes('WAGMIOVL'), 1337n * 10n ** 4n, 100000n, 2n, 1000n, 1000n, 1000n, true)).to.be.revertedWith( "Series overlaps with existing");
      await expect(callMetadataAs(operator).addSeries(stringToBytes('WAGMIOVL'), 1337n * 10n ** 4n, 101000n, 1000n, 1000n, 1000n, 1000n, true)).to.be.revertedWith( "Series overlaps with existing");
    });

    it("Gets availability correctly", async function () {
      const { user, callMetadataAs, wagmiId, uniqueId } = await loadFixture(setSeriesFixture);
      const available = await callMetadataAs(user).getAvailableSeries();

      expect(available).to.have.lengthOf(2);
      expect(available[0]).to.equal(wagmiId);
      expect(available[1]).to.equal(uniqueId);
    });

    it("Sets availability correctly", async function () {
      const { operator, user, callMetadataAs, wagmiId, ogId } = await loadFixture(setSeriesFixture);

      await Promise.all([
        (await callMetadataAs(operator).setSeriesAvailability(wagmiId, false)).wait(),
        (await callMetadataAs(operator).setSeriesAvailability(ogId, true)).wait(),
      ]);

      const [ wagmi, og ] = await Promise.all([
        callMetadataAs(user).getSeries(wagmiId),
        callMetadataAs(user).getSeries(ogId),
      ]);

      expect(wagmi.isAvailable).to.be.false;
      expect(og.isAvailable).to.be.true;
    });

    it("Reverts on setting availability for non-existent series", async function () {
      const { operator, callMetadataAs } = await loadFixture(deployContractsFixture);

      await expect(callMetadataAs(operator).setSeriesAvailability(42n, false)).to.be.revertedWith("Invalid series index");
    });

    it("Sets series as unavailable upon minting last token available", async function () {
      const { operator, callNeuAs, callMetadataAs, uniqueId } = await loadFixture(setSeriesFixture);

      const originalMetadata = await callMetadataAs(operator).getSeries(uniqueId);

      await (await callNeuAs(operator).safeMint(operator.address, uniqueId)).wait();

      const updatedMetadata = await callMetadataAs(operator).getSeries(uniqueId);

      expect(originalMetadata.isAvailable).to.be.true;
      expect(updatedMetadata.isAvailable).to.be.false;
    });

    it("Reverts on setting fully minted series as available", async function () {
      const { operator, callNeuAs, callMetadataAs, uniqueId } = await loadFixture(setSeriesFixture);

      await (await callNeuAs(operator).safeMint(operator.address, uniqueId)).wait();

      await expect(callMetadataAs(operator).setSeriesAvailability(uniqueId, true)).to.be.revertedWith("Series has been fully minted");
    });

    it("Reverts on setting availability for non-operator", async function () {
      const { user, callMetadataAs, wagmiId } = await loadFixture(setSeriesFixture);

      await expect(callMetadataAs(user).setSeriesAvailability(wagmiId, false)).to.be.reverted;
    });
  });

  describe("Pricing", function () {
    it("Sets price correctly", async function () {
      const { operator, user, callMetadataAs, wagmiId } = await loadFixture(setSeriesFixture);

      await (await callMetadataAs(operator).setPriceInGwei(wagmiId, 42n)).wait();

      const wagmi = await callMetadataAs(user).getSeries(wagmiId);

      expect(wagmi.priceInGwei).to.equal(42n);
    });

    it("Reverts on setting price for non-existent series", async function () {
      const { operator, callMetadataAs } = await loadFixture(deployContractsFixture);

      await expect(callMetadataAs(operator).setPriceInGwei(42n, 42n)).to.be.revertedWith("Invalid series index");
    });

    it("Reverts on setting price for non-operator", async function () {
      const { user, callMetadataAs, wagmiId } = await loadFixture(setSeriesFixture);

      await expect(callMetadataAs(user).setPriceInGwei(wagmiId, 42n)).to.be.reverted;
    });
  });

  describe("Token metadata", function () {
    it("Gets token metadata correctly", async function () {
      const { user, callMetadataAs } = await loadFixture(purchasedTokensFixture);

      const ogTokenURIBase64 = await callMetadataAs(user).tokenURI(1n);
      const ogTokenMetadata: TokenMetadata = JSON.parse(Buffer.from(ogTokenURIBase64.split(",")[1], "base64").toString("utf-8"));

      const wagmiTokenURIBase64 = await callMetadataAs(user).tokenURI(100002n);
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

  describe("Dynamic traits", function () {
    it("Gets dynamic trait correctly", async function () {
      const { user, callMetadataAs } = await loadFixture(purchasedTokensFixture);

      const pointsTrait = stringToBytes("points", 32);

      const ogTokenTraitBytes = await callMetadataAs(user).getTraitValue(1n, pointsTrait);
      const wagmiTokenTraitBytes = await callMetadataAs(user).getTraitValue(100002n, pointsTrait);

      const ogTokenTrait = parseInt(ogTokenTraitBytes.substring(2), 16);
      const wagmiTokenTrait = parseInt(wagmiTokenTraitBytes.substring(2), 16);

      expect(ogTokenTrait).to.equal(1337);
      expect(wagmiTokenTrait).to.equal(0);
    });

    it("Reverts on getting nonexistant dynamic trait", async function () {
      const { user, callMetadataAs } = await loadFixture(purchasedTokensFixture);

      const nonexistantTrait = stringToBytes("nonexistant", 32);

      await expect(callMetadataAs(user).getTraitValue(1n, nonexistantTrait)).to.be.revertedWith("Trait key not found");
    });

    it("Gets multiple dynamic traits correctly", async function () {
      const { user, callMetadataAs } = await loadFixture(purchasedTokensFixture);

      const pointsTrait = stringToBytes("points", 32);

      const ogTokenTraitBytes = await callMetadataAs(user).getTraitValues(1n, [pointsTrait]);

      const ogTokenTrait = ogTokenTraitBytes.map((trait) => parseInt(trait.substring(2), 16));

      expect(ogTokenTrait[0]).to.equal(1337);
    });
  });

  describe("Logo", function () {
    it("Sets logo contract correctly", async function () {
      const { operator, user, storage, logo, callMetadataAs, wagmiId } = await loadFixture(purchasedTokensFixture);

      const storageAddress = await storage.getAddress() as `0x${string}`;
      const logoAddress = await logo.getAddress() as `0x${string}`;

      await (await callMetadataAs(operator).setLogoContract(storageAddress)).wait();

      await expect(callMetadataAs(user).getSeries(wagmiId)).to.be.reverted;

      await (await callMetadataAs(operator).setLogoContract(logoAddress)).wait();

      const wagmi = await callMetadataAs(user).getSeries(wagmiId);

      validateSvg(wagmi.logoSvg);
    });
  });

  describe("Access control specifics", function () {
    it("Obeys new roles in set availability calls", async function () {
      const { callMetadataAs, admin, operator, user, wagmiId } = await loadFixture(setSeriesFixture);
      const { operatorRole } = getRoles();

      await (await callMetadataAs(admin).grantRole(operatorRole, user.address as `0x${string}`)).wait();
      await (await callMetadataAs(admin).revokeRole(operatorRole, operator.address as `0x${string}`)).wait();

      await expect(callMetadataAs(operator).setSeriesAvailability(wagmiId, false)).to.be.reverted;
      await expect(callMetadataAs(user).setSeriesAvailability(wagmiId, false)).not.to.be.reverted;
    });
  });

  describe("Access control", accessControlTestFactory(AccessControlSupportedContracts.Metadata));
});
