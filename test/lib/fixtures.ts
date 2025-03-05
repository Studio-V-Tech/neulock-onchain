import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { BaseContract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import deployContracts from "../../scripts/deploy-contracts-core";
import NeuBaseContract from "../../scripts/interfaces/neu.model";
import MetadataBaseContract from "../../scripts/interfaces/metadata.model";
import StorageBaseContract from "../../scripts/interfaces/storage.model";
import { day, stringToBytes, seriesValue, userDataBytesArray } from "../../scripts/lib/utils";

export async function deployContractsFixture({ isTest = false } = {}) {
  const [operator, upgrader, admin, user, user2, user3, user4, user5] = await ethers.getSigners();

  const [neuDeployment, storageDeployment, metadataDeployment] = await deployContracts({
    isTest,
  });

  const Neu = await ethers.getContractFactory(isTest ? "NeuHarness" : "Neu");
  const neu = Neu.attach(await neuDeployment.getAddress());

  function setNeuCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): NeuBaseContract {
    return contract.connect(runner) as NeuBaseContract;
  }

  const callNeuAs = (runner: HardhatEthersSigner) => setNeuCallerFactory(neu, runner);

  function setMetadataCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): MetadataBaseContract {
    return contract.connect(runner) as MetadataBaseContract;
  }

  const callMetadataAs = (runner: HardhatEthersSigner) => setMetadataCallerFactory(metadata, runner);

  const Metadata = await ethers.getContractFactory("NeuMetadata");
  const metadata = Metadata.attach(await metadataDeployment.getAddress());

  function setStorageCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): StorageBaseContract {
    return contract.connect(runner) as StorageBaseContract;
  }

  const callStorageAs = (runner: HardhatEthersSigner) => setStorageCallerFactory(storage, runner);

  const Storage = await ethers.getContractFactory("NeuStorage");
  const storage = Storage.attach(await storageDeployment.getAddress());
  return { neu, metadata, storage, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, neuDeployment };
}

export async function setSeriesFixture() {
  const { neu, metadata, storage, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs } = await loadFixture(deployContractsFixture);

  await (await callMetadataAs(operator).addSeries(stringToBytes('WAGMI'), 1337n * 10n ** 4n, 100001n, 1000n, 58328n, 6279n, 65153n, true)).wait();
  await (await callMetadataAs(operator).addSeries(stringToBytes('OG'), 1337n * 10n ** 5n, 1n, 100n, 58328n, 6279n, 65153n, false)).wait();
  await (await callMetadataAs(operator).addSeries(stringToBytes('UNIQUE'), 1n, 101n, 1n, 58328n, 6279n, 65153n, true)).wait();

  return { neu, metadata, storage, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, wagmiId: 0n, ogId: 1n, uniqueId: 2n };
}

export async function purchasedTokensFixture() {
  const {
    neu, metadata, storage, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, wagmiId, ogId, uniqueId
  } = await loadFixture(setSeriesFixture);

  await (await callMetadataAs(operator).setSeriesAvailability(ogId, true)).wait();

  const wagmi = await callMetadataAs(user).getSeries(wagmiId);
  const og = await callMetadataAs(user).getSeries(ogId);

  // User - WAGMI #100001 - Day 0
  await (await callNeuAs(user).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User2 - OG #1 - Day 1
  await (await callNeuAs(user2).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User3 - WAGMI #100002 - Day 1
  await (await callNeuAs(user3).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User2 - OG #2 - Day 2
  await (await callNeuAs(user2).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User3 - WAGMI #100003 - Day 2
  await (await callNeuAs(user3).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User3 - OG #3 - Day 3
  await (await callNeuAs(user3).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User4 - WAGMI #100004 - Day 3
  await (await callNeuAs(user4).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  await time.increase(day);

  // User4 - OG #4 - Day 4
  await (await callNeuAs(user3).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  // User5 - WAGMI #100005 - Day 4 (non-refundable)
  await (await callNeuAs(operator).safeMint(user5.address, wagmiId)).wait();

  // User5 - OG #5 - Day 4 (non-refundable)
  await (await callNeuAs(operator).safeMint(user5.address, ogId)).wait();

  // Day5
  await time.increase(day);

  return { neu, metadata, admin, storage, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, wagmiId, ogId, uniqueId };
}

export async function setUserDataFixture() {
  const {
    neu, metadata, storage, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, wagmiId, ogId, uniqueId
  } = await loadFixture(purchasedTokensFixture);

  await (await callStorageAs(user).saveData(100001n, userDataBytesArray[1], { value: 0n })).wait();
  await (await callStorageAs(user2).saveData(2n, userDataBytesArray[2], { value: 10n ** 14n })).wait();
  await (await callStorageAs(user3).saveData(3n, userDataBytesArray[3], { value: 10n ** 16n })).wait();
  await (await callStorageAs(user4).saveData(100004n, userDataBytesArray[4], { value: 10n ** 18n })).wait();
  await (await callStorageAs(user5).saveData(5n, userDataBytesArray[5], { value: 9n * 10n ** 20n })).wait();

  return { neu, metadata, admin, storage, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, wagmiId, ogId, uniqueId };
}


