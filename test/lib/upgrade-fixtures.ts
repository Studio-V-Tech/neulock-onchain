import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, upgrades } from "hardhat";
import { BaseContract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { day, stringToBytes, seriesValue, userDataBytesArray } from "../../scripts/lib/utils";
import deployContractsV1 from "../../scripts/deploy-contracts-core-v1";
import NeuBaseContract from "../../scripts/interfaces/neu.model";
import MetadataBaseContract from "../../scripts/interfaces/metadata.model";
import StorageBaseContract from "../../scripts/interfaces/storage.model";
import EntitlementBaseContract from "../../scripts/interfaces/entitlement.model";
import DaoLockBaseContract from "../../scripts/interfaces/lock.model";

function setNeuCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): NeuBaseContract {
  return contract.connect(runner) as NeuBaseContract;
}

function setStorageCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): StorageBaseContract {
  return contract.connect(runner) as StorageBaseContract;
}

function setMetadataCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): MetadataBaseContract {
  return contract.connect(runner) as MetadataBaseContract;
}

function setEntitlementCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): EntitlementBaseContract {
  return contract.connect(runner) as EntitlementBaseContract;
}

function setLockCallerFactory (contract: BaseContract, runner: HardhatEthersSigner): DaoLockBaseContract {
  return contract.connect(runner) as DaoLockBaseContract;
}

export async function deployContractsV1Fixture({ isTest = false } = {}) {
  const [operator, upgrader, admin, user, user2, user3, user4, user5] = await ethers.getSigners();

  const [neuDeployment, storageDeployment, metadataDeployment, _logoDeployment, entitlementDeployment, lockDeployment] = await deployContractsV1({
    isTest,
  });

  const NeuV1 = await ethers.getContractFactory(isTest ? "NeuHarnessV1" : "NeuV1");
  const neuV1 = NeuV1.attach(await neuDeployment.getAddress());
  const callNeuV1As = (runner: HardhatEthersSigner) => setNeuCallerFactory(neuV1, runner);

  const MetadataV1 = await ethers.getContractFactory("NeuMetadataV1");
  const metadataV1 = MetadataV1.attach(await metadataDeployment.getAddress());
  const callMetadataV1As = (runner: HardhatEthersSigner) => setMetadataCallerFactory(metadataV1, runner);

  const StorageV1 = await ethers.getContractFactory("NeuStorageV1");
  const storageV1 = StorageV1.attach(await storageDeployment.getAddress());
  const callStorageV1As = (runner: HardhatEthersSigner) => setStorageCallerFactory(storageV1, runner);

  const EntitlementV1 = await ethers.getContractFactory("NeuEntitlementV1");
  const entitlementV1 = EntitlementV1.attach(await entitlementDeployment.getAddress());
  const callEntitlementV1As = (runner: HardhatEthersSigner) => setEntitlementCallerFactory(entitlementV1, runner);

  const DaoLockV1 = await ethers.getContractFactory("NeuDaoLockV1");
  const lockV1 = DaoLockV1.attach(await lockDeployment.getAddress());
  const callLockV1As = (runner: HardhatEthersSigner) => setLockCallerFactory(lockV1, runner);

  return { neuV1, metadataV1, storageV1, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As, callLockV1As };
}

export async function useContractsV1Fixture() {
  const { neuV1, metadataV1, storageV1, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As, callLockV1As } = await loadFixture(deployContractsV1Fixture);

  const wagmiId = 0n, ogId = 1n, uniqueId = 2n;

  await (await callMetadataV1As(operator).addSeries(stringToBytes('WAGMI1'), 1337n * 10n ** 4n, 100001n, 1000n, 58328n, 6279n, 65153n, true)).wait();
  await (await callMetadataV1As(operator).addSeries(stringToBytes('OG1'), 1337n * 10n ** 5n, 1n, 100n, 58328n, 6279n, 65153n, false)).wait();
  await (await callMetadataV1As(operator).addSeries(stringToBytes('UNIQUE'), 1n, 101n, 1n, 58328n, 6279n, 65153n, true)).wait();

  await (await callMetadataV1As(operator).setSeriesAvailability(ogId, true)).wait();

  const wagmi = await callMetadataV1As(user).getSeries(wagmiId);
  const og = await callMetadataV1As(user).getSeries(ogId);

  // User - WAGMI #100001 - Day 0
  await (await callNeuV1As(user).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User2 - OG #1 - Day 1
  await (await callNeuV1As(user2).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User3 - WAGMI #100002 - Day 1
  await (await callNeuV1As(user3).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User2 - OG #2 - Day 2
  await (await callNeuV1As(user2).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User3 - WAGMI #100003 - Day 2
  await (await callNeuV1As(user3).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User3 - OG #3 - Day 3
  await (await callNeuV1As(user3).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User4 - WAGMI #100004 - Day 3
  await (await callNeuV1As(user4).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User4 - OG #4 - Day 4
  await (await callNeuV1As(user3).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User5 - WAGMI #100005 - Day 4 (non-refundable)
  await (await callNeuV1As(operator).safeMint(user5.address, wagmiId)).wait();

  // User5 - OG #5 - Day 4 (non-refundable)
  await (await callNeuV1As(operator).safeMint(user5.address, ogId)).wait();

  // Day5
  await time.increase(day);

  await (await callStorageV1As(user).saveData(100001n, userDataBytesArray[1], { value: 0n })).wait();
  await (await callStorageV1As(user2).saveData(2n, userDataBytesArray[2], { value: 10n ** 14n })).wait();
  await (await callStorageV1As(user3).saveData(3n, userDataBytesArray[3], { value: 10n ** 16n })).wait();
  await (await callStorageV1As(user4).saveData(100004n, userDataBytesArray[4], { value: 10n ** 18n })).wait();
  await (await callStorageV1As(user5).saveData(5n, userDataBytesArray[5], { value: 9n * 10n ** 20n })).wait();

  const sponsorTransferTotal = 10n ** 14n + 10n ** 16n + 10n ** 18n + 9n * 10n ** 20n;

  return { neuV1, metadataV1, storageV1, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As, callLockV1As,  wagmiId, ogId, uniqueId, sponsorTransferTotal };
}

export async function upgradeToStorageV2Fixture() {
  const { neuV1, metadataV1, storageV1, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callEntitlementV1As, callLockV1As,  wagmiId, ogId, uniqueId, sponsorTransferTotal } = await loadFixture(useContractsV1Fixture);

  const StorageV2 = await ethers.getContractFactory("NeuStorageV2", upgrader);
  const entitlementAddress = await entitlementV1.getAddress();
  const storageAddress = await storageV1.getAddress();

  const storageV2 = await upgrades.upgradeProxy(storageAddress, StorageV2, {
    call: {
      fn: 'initializeV2',
      args: [entitlementAddress],
    },
  });

  const callStorageV2As = (runner: HardhatEthersSigner) => setStorageCallerFactory(storageV2, runner);

  return { neuV1, metadataV1, storageV2, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callEntitlementV1As, callLockV1As, callStorageV2As, wagmiId, ogId, uniqueId, sponsorTransferTotal };
}

export async function upgradeToNeuV2Fixture({ isTest = false } = {}) {
  const { neuV1, metadataV1, storageV2, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callMetadataV1As, callEntitlementV1As, callLockV1As, callStorageV2As, wagmiId, ogId, uniqueId, sponsorTransferTotal } = await loadFixture(upgradeToStorageV2Fixture);

  const NeuV2 = await ethers.getContractFactory((isTest ? "NeuHarnessV2" : "NeuV2"), upgrader);
  const neuAddress = await neuV1.getAddress();
  const lockAddress = await lockV1.getAddress();

  const neuV2 = await upgrades.upgradeProxy(neuAddress, NeuV2, {
    call: {
      fn: 'initializeV2',
      args: [lockAddress],
    },
  });

  const callNeuV2As = (runner: HardhatEthersSigner) => setNeuCallerFactory(neuV2, runner);

  return { neuV2, metadataV1, storageV2, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV2As, callMetadataV1As, callLockV1As, callStorageV2As, callEntitlementV1As, wagmiId, ogId, uniqueId, sponsorTransferTotal };
}

export async function upgradeToMetadataV2Fixture() {
  const { neuV2, metadataV1, storageV2, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV2As, callEntitlementV1As, callLockV1As, callStorageV2As, wagmiId, ogId, uniqueId, sponsorTransferTotal } = await loadFixture(upgradeToNeuV2Fixture);

  const MetadataV2 = await ethers.getContractFactory("NeuMetadataV2", upgrader);
  const metadataAddress = await metadataV1.getAddress();

  const metadataV2 = await upgrades.upgradeProxy(metadataAddress, MetadataV2);

  const callMetadataV2As = (runner: HardhatEthersSigner) => setMetadataCallerFactory(metadataV2, runner);

  return { neuV2, metadataV2, storageV2, entitlementV1, lockV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV2As, callMetadataV2As, callLockV1As, callStorageV2As, callEntitlementV1As, wagmiId, ogId, uniqueId, sponsorTransferTotal };
}