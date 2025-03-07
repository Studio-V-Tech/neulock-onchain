import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, upgrades } from "hardhat";
import { BaseContract, ContractTransactionResponse } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import deployContractsV1 from "../../scripts/deploy-contracts-core-v1";
import NeuBaseContract from "../../scripts/interfaces/neu.model";
import MetadataBaseContract from "../../scripts/interfaces/metadata.model";
import StorageBaseContract from "../../scripts/interfaces/storage.model";
import EntitlementBaseContract from "../../scripts/interfaces/entitlement.model";

export async function deployContractsV1Fixture({ isTest = false } = {}) {
  const [operator, upgrader, admin, user, user2, user3, user4, user5] = await ethers.getSigners();

  const [neuDeployment, storageDeployment, metadataDeployment, _logoDeployment, entitlementDeployment] = await deployContractsV1({
    isTest,
  });

  const NeuV1 = await ethers.getContractFactory(isTest ? "NeuHarness" : "Neu");
  const neuV1 = NeuV1.attach(await neuDeployment.getAddress());

  function setNeuCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): NeuBaseContract {
    return contract.connect(runner) as NeuBaseContract;
  }

  const callNeuAs = (runner: HardhatEthersSigner) => setNeuCallerFactory(neuV1, runner);

  function setMetadataCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): MetadataBaseContract {
    return contract.connect(runner) as MetadataBaseContract;
  }

  const callMetadataAs = (runner: HardhatEthersSigner) => setMetadataCallerFactory(metadataV1, runner);

  const MetadataV1 = await ethers.getContractFactory("NeuMetadata");
  const metadataV1 = MetadataV1.attach(await metadataDeployment.getAddress());

  function setStorageCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): StorageBaseContract {
    return contract.connect(runner) as StorageBaseContract;
  }

  const callStorageAs = (runner: HardhatEthersSigner) => setStorageCallerFactory(storageV1, runner);

  const StorageV1 = await ethers.getContractFactory("NeuStorage");
  const storageV1 = StorageV1.attach(await storageDeployment.getAddress());

  function setEntitlementCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): EntitlementBaseContract {
    return contract.connect(runner) as EntitlementBaseContract;
  }

  const callEntitlementAs = (runner: HardhatEthersSigner) => setEntitlementCallerFactory(entitlementV1, runner);

  const EntitlementV1 = await ethers.getContractFactory("NeuEntitlement");
  const entitlementV1 = EntitlementV1.attach(await entitlementDeployment.getAddress());

  return { neuV1, metadataV1, storageV1, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs };
}

export async function upgradeToStorageV2Fixture() {
  const { neuV1, metadataV1, storageV1, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs } = await loadFixture(deployContractsV1Fixture);

  const StorageV2 = await ethers.getContractFactory("NeuStorageV2");
  const entitlementAddress = await entitlementV1.getAddress();
  const storageAddress = await storageV1.getAddress();

  const storageV2 = await upgrades.upgradeProxy(storageAddress, StorageV2, { call: {
    fn: 'initializeV2',
    args: [entitlementAddress],
  }});

  return { neuV1, metadataV1, storageV1, storageV2, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs };
}