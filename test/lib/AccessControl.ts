import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { BaseContract } from "ethers";

import { getRoles } from "../../scripts/lib/utils";
import { deployContractsFixture } from "./fixtures";
import AccessControl from "../../scripts/interfaces/lib/access-control.model";

export interface AccessControlBaseContract extends BaseContract, AccessControl { }

export enum AccessControlSupportedContracts {
  Neu,
  Metadata,
  Storage,
  Entitlement,
}

const contractsWithUpgrader = [
  AccessControlSupportedContracts.Neu,
  AccessControlSupportedContracts.Metadata,
  AccessControlSupportedContracts.Storage,
  AccessControlSupportedContracts.Entitlement,
];

const contractsWithOperator = [
  AccessControlSupportedContracts.Neu,
  AccessControlSupportedContracts.Metadata,
  AccessControlSupportedContracts.Entitlement,
];

type CallAs = (runner: HardhatEthersSigner) => AccessControlBaseContract;

function getCallAs(contract: AccessControlSupportedContracts, neu: CallAs, metadata: CallAs, storage: CallAs, entitlement: CallAs) {
  switch (contract) {
    case AccessControlSupportedContracts.Neu:
      return neu;
    case AccessControlSupportedContracts.Metadata:
      return metadata;
    case AccessControlSupportedContracts.Storage:
      return storage;
    case AccessControlSupportedContracts.Entitlement:
      return entitlement;
  }
}

export function accessControlTestFactory(contract: AccessControlSupportedContracts) {
  return function () {
    it("Sets default roles correctly", async function () {
      const {
        callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs,
        admin, upgrader, operator, user
      } = await loadFixture(deployContractsFixture);

      const callAs = getCallAs(contract, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs);
      const { adminRole, upgraderRole, operatorRole } = getRoles();

      expect(await callAs(user).hasRole(adminRole, admin.address as `0x${string}`)).to.be.true;

      if (contractsWithUpgrader.includes(contract)) {
        expect(await callAs(user).hasRole(upgraderRole, upgrader.address as `0x${string}`)).to.be.true;
      } else {
        expect(await callAs(user).hasRole(upgraderRole, upgrader.address as `0x${string}`)).to.be.false;
      }
        
      if (contractsWithOperator.includes(contract)) {
        expect(await callAs(user).hasRole(operatorRole, operator.address as `0x${string}`)).to.be.true;
      } else {
        expect(await callAs(user).hasRole(operatorRole, operator.address as `0x${string}`)).to.be.false;
      }

      expect(await callAs(user).hasRole(adminRole, user.address as `0x${string}`)).to.be.false;
      expect(await callAs(user).hasRole(adminRole, upgrader.address as `0x${string}`)).to.be.false;
      expect(await callAs(user).hasRole(adminRole, operator.address as `0x${string}`)).to.be.false;
      expect(await callAs(user).hasRole(upgraderRole, admin.address as `0x${string}`)).to.be.false;
    });

    it("Sets role admins correctly", async function () {
      const {
        callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs,
        user
      } = await loadFixture(deployContractsFixture);

      const callAs = getCallAs(contract, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs);

      const { adminRole, upgraderRole, operatorRole } = getRoles();

      expect(await callAs(user).getRoleAdmin(adminRole)).to.equal(adminRole);
      expect(await callAs(user).getRoleAdmin(upgraderRole)).to.equal(adminRole);
      expect(await callAs(user).getRoleAdmin(operatorRole)).to.equal(adminRole);
    });

    it("Grants roles correctly", async function () {
      const {
        callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs,
        admin, user, user2
      } = await loadFixture(deployContractsFixture);

      const callAs = getCallAs(contract, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs);

      const { upgraderRole, operatorRole } = getRoles();

      await (await callAs(admin).grantRole(upgraderRole, user.address as `0x${string}`)).wait();
      await (await callAs(admin).grantRole(operatorRole, user2.address as `0x${string}`)).wait();

      expect(await callAs(user).hasRole(upgraderRole, user.address as `0x${string}`)).to.be.true;
      expect(await callAs(user2).hasRole(operatorRole, user2.address as `0x${string}`)).to.be.true;

    });

    it("Revokes roles correctly", async function () {
      const {
        callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs,
        admin, upgrader, operator, user
      } = await loadFixture(deployContractsFixture);

      const callAs = getCallAs(contract, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs);

      const { upgraderRole, operatorRole } = getRoles();

      await (await callAs(admin).revokeRole(upgraderRole, upgrader.address as `0x${string}`)).wait();
      await (await callAs(admin).revokeRole(operatorRole, operator.address as `0x${string}`)).wait();

      expect(await callAs(user).hasRole(upgraderRole, upgrader.address as `0x${string}`)).to.be.false;
      expect(await callAs(user).hasRole(operatorRole, operator.address as `0x${string}`)).to.be.false;

    });

    it("Obeys new roles in function calls", async function () {
      const {
        callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs,
        admin, user, user2
      } = await loadFixture(deployContractsFixture);

      const callAs = getCallAs(contract, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs);

      const { adminRole, upgraderRole } = getRoles();

      await (await callAs(admin).grantRole(adminRole, user.address as `0x${string}`)).wait();
      await (await callAs(admin).revokeRole(adminRole, admin.address as `0x${string}`)).wait();

      await expect(callAs(admin).grantRole(upgraderRole, user2.address as `0x${string}`)).to.be.reverted;
      await expect(callAs(user).grantRole(upgraderRole, user2.address as `0x${string}`)).not.to.be.reverted;
    });


    it("Sets admin role correctly", async function () {
      const {
        callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs,
        admin, user, user2
      } = await loadFixture(deployContractsFixture);

      const callAs = getCallAs(contract, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs);

      const { adminRole, upgraderRole } = getRoles();

      await (await callAs(admin).grantRole(adminRole, user.address as `0x${string}`)).wait();
      await (await callAs(admin).revokeRole(adminRole, admin.address as `0x${string}`)).wait();
      await (await callAs(user).grantRole(adminRole, user2.address as `0x${string}`)).wait();

      expect(await callAs(user).hasRole(adminRole, user.address as `0x${string}`)).to.be.true;
      expect(await callAs(user2).hasRole(adminRole, user.address as `0x${string}`)).to.be.true;
      expect(await callAs(user).hasRole(adminRole, admin.address as `0x${string}`)).to.be.false;
      await expect(callAs(admin).grantRole(upgraderRole, user2.address as `0x${string}`)).to.be.reverted;
    });

    it("Reverts on setting roles for non-admin", async function () {
      const {
        callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs,
        user, user2, upgrader, operator
      } = await loadFixture(deployContractsFixture);

      const callAs = getCallAs(contract, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs);

      const { adminRole, upgraderRole, operatorRole } = getRoles();

      await expect(callAs(user).grantRole(adminRole, user2.address as `0x${string}`)).to.be.reverted;
      await expect(callAs(user).grantRole(upgraderRole, user2.address as `0x${string}`)).to.be.reverted;
      await expect(callAs(upgrader).grantRole(adminRole, user2.address as `0x${string}`)).to.be.reverted;
      await expect(callAs(upgrader).grantRole(upgraderRole, upgrader.address as `0x${string}`)).to.be.reverted;
      await expect(callAs(operator).grantRole(operatorRole, user2.address as `0x${string}`)).to.be.reverted;
      await expect(callAs(operator).grantRole(upgraderRole, operator.address as `0x${string}`)).to.be.reverted;
    });
  };
}
