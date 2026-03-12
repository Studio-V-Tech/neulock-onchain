import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployManagedAccountsFixture() {
  const [owner, otherAccount, managedAccount] = await ethers.getSigners();
  const managedAccountsFactory = await ethers.getContractFactory(
    "NeuManagedAccountsV1",
  );
  const managedAccounts = await managedAccountsFactory.deploy(owner.address);

  return {
    managedAccount,
    managedAccounts,
    otherAccount,
    owner,
  };
}

describe("NeuManagedAccountsV1", function () {
  describe("Deployment", function () {
    it("sets the initial owner", async function () {
      const { managedAccounts, owner } = await loadFixture(
        deployManagedAccountsFixture,
      );

      expect(await managedAccounts.owner()).to.equal(owner.address);
    });

    it("reverts when the initial owner is the zero address", async function () {
      const managedAccountsFactory = await ethers.getContractFactory(
        "NeuManagedAccountsV1",
      );

      await expect(
        managedAccountsFactory.deploy(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(
        managedAccountsFactory,
        "OwnableInvalidOwner",
      );
    });
  });

  describe("Whitelist management", function () {
    it("adds an account to the whitelist", async function () {
      const { managedAccount, managedAccounts } = await loadFixture(
        deployManagedAccountsFixture,
      );

      await expect(managedAccounts.add(managedAccount.address))
        .to.emit(managedAccounts, "AccountAdded")
        .withArgs(managedAccount.address);

      expect(await managedAccounts.balanceOf(managedAccount.address)).to.equal(1n);
    });

    it("removes an account from the whitelist", async function () {
      const { managedAccount, managedAccounts } = await loadFixture(
        deployManagedAccountsFixture,
      );

      await managedAccounts.add(managedAccount.address);
      await expect(managedAccounts.remove(managedAccount.address))
        .to.emit(managedAccounts, "AccountRemoved")
        .withArgs(managedAccount.address);

      expect(await managedAccounts.balanceOf(managedAccount.address)).to.equal(0n);
    });

    it("is idempotent when adding the same account twice", async function () {
      const { managedAccount, managedAccounts } = await loadFixture(
        deployManagedAccountsFixture,
      );

      await expect(managedAccounts.add(managedAccount.address))
        .to.emit(managedAccounts, "AccountAdded")
        .withArgs(managedAccount.address);
      await expect(managedAccounts.add(managedAccount.address))
        .to.emit(managedAccounts, "AccountAdded")
        .withArgs(managedAccount.address);

      expect(await managedAccounts.balanceOf(managedAccount.address)).to.equal(1n);
    });

    it("is idempotent when removing the same account twice", async function () {
      const { managedAccount, managedAccounts } = await loadFixture(
        deployManagedAccountsFixture,
      );

      await managedAccounts.add(managedAccount.address);
      await expect(managedAccounts.remove(managedAccount.address))
        .to.emit(managedAccounts, "AccountRemoved")
        .withArgs(managedAccount.address);
      await expect(managedAccounts.remove(managedAccount.address))
        .to.emit(managedAccounts, "AccountRemoved")
        .withArgs(managedAccount.address);

      expect(await managedAccounts.balanceOf(managedAccount.address)).to.equal(0n);
    });

    it("keeps other accounts unchanged when removing one account", async function () {
      const { managedAccount, managedAccounts, otherAccount } =
        await loadFixture(deployManagedAccountsFixture);

      await managedAccounts.add(managedAccount.address);
      await managedAccounts.add(otherAccount.address);
      await managedAccounts.remove(managedAccount.address);

      expect(await managedAccounts.balanceOf(managedAccount.address)).to.equal(0n);
      expect(await managedAccounts.balanceOf(otherAccount.address)).to.equal(1n);
    });

    it("returns zero for accounts that were never added", async function () {
      const { managedAccount, managedAccounts } = await loadFixture(
        deployManagedAccountsFixture,
      );

      expect(await managedAccounts.balanceOf(managedAccount.address)).to.equal(0n);
    });
  });

  describe("Access control", function () {
    it("reverts when a non-owner adds an account", async function () {
      const { managedAccount, managedAccounts, otherAccount } =
        await loadFixture(deployManagedAccountsFixture);

      await expect(
        managedAccounts.connect(otherAccount).add(managedAccount.address),
      ).to.be.revertedWithCustomError(
        managedAccounts,
        "OwnableUnauthorizedAccount",
      ).withArgs(otherAccount.address);
    });

    it("reverts when a non-owner removes an account", async function () {
      const { managedAccount, managedAccounts, otherAccount } =
        await loadFixture(deployManagedAccountsFixture);

      await expect(
        managedAccounts.connect(otherAccount).remove(managedAccount.address),
      ).to.be.revertedWithCustomError(
        managedAccounts,
        "OwnableUnauthorizedAccount",
      ).withArgs(otherAccount.address);
    });
  });
});
