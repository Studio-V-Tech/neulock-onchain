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

export async function deployContractsV1Fixture({ isTest = false } = {}) {
  const [operator, upgrader, admin, user, user2, user3, user4, user5] = await ethers.getSigners();

  const [neuDeployment, storageDeployment, metadataDeployment, _logoDeployment, entitlementDeployment] = await deployContractsV1({
    isTest,
  });

  const NeuV1 = await ethers.getContractFactory(isTest ? "NeuHarnessV1" : "NeuV1");
  const neuV1 = NeuV1.attach(await neuDeployment.getAddress());

  const callNeuV1As = (runner: HardhatEthersSigner) => setNeuCallerFactory(neuV1, runner);

  const callMetadataV1As = (runner: HardhatEthersSigner) => setMetadataCallerFactory(metadataV1, runner);

  const MetadataV1 = await ethers.getContractFactory("NeuMetadataV1");
  const metadataV1 = MetadataV1.attach(await metadataDeployment.getAddress());

  const callStorageV1As = (runner: HardhatEthersSigner) => setStorageCallerFactory(storageV1, runner);

  const StorageV1 = await ethers.getContractFactory("NeuStorageV1");
  const storageV1 = StorageV1.attach(await storageDeployment.getAddress());

  const callEntitlementV1As = (runner: HardhatEthersSigner) => setEntitlementCallerFactory(entitlementV1, runner);

  const EntitlementV1 = await ethers.getContractFactory("NeuEntitlementV1");
  const entitlementV1 = EntitlementV1.attach(await entitlementDeployment.getAddress());

  return { neuV1, metadataV1, storageV1, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As };
}

export async function useContractsV1Fixture() {
  const { neuV1, metadataV1, storageV1, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As } = await loadFixture(deployContractsV1Fixture);

  const wagmiId = 0n, ogId = 1n, uniqueId = 2n;

  await (await callMetadataV1As(operator).addSeries(stringToBytes('WAGMI'), 1337n * 10n ** 4n, 100001n, 1000n, 58328n, 6279n, 65153n, true)).wait();
  await (await callMetadataV1As(operator).addSeries(stringToBytes('OG'), 1337n * 10n ** 5n, 1n, 100n, 58328n, 6279n, 65153n, false)).wait();
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

  return { neuV1, metadataV1, storageV1, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As,  wagmiId, ogId, uniqueId };
}

export async function upgradeToStorageV2Fixture() {
  const { neuV1, metadataV1, storageV1, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As, wagmiId, ogId, uniqueId } = await loadFixture(useContractsV1Fixture);

  const StorageV2 = await ethers.getContractFactory("NeuStorageV2", upgrader);
  const callStorageV2As = (runner: HardhatEthersSigner) => setStorageCallerFactory(storageV2, runner);
  const entitlementAddress = await entitlementV1.getAddress();
  const storageAddress = await storageV1.getAddress();

  const storageV2 = await upgrades.upgradeProxy(storageAddress, StorageV2, {
    call: {
      fn: 'initializeV2',
      args: [entitlementAddress],
    },
  },
);

  return { neuV1, metadataV1, storageV1, storageV2, entitlementV1, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuV1As, callMetadataV1As, callStorageV1As, callEntitlementV1As, callStorageV2As, wagmiId, ogId, uniqueId };
}