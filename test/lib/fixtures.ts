import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, unlock } from "hardhat";
import { BaseContract, ContractTransactionResponse } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import deployContracts from "../../scripts/deploy-contracts-core";
import NeuBaseContract from "../../scripts/interfaces/neu.model";
import MetadataBaseContract from "../../scripts/interfaces/metadata.model";
import StorageBaseContract from "../../scripts/interfaces/storage.model";
import EntitlementBaseContract from "../../scripts/interfaces/entitlement.model";
import DaoLockBaseContract from "../../scripts/interfaces/lock.model";
import { day, stringToBytes, seriesValue, userDataBytesArray } from "../../scripts/lib/utils";

interface PublicUnlockBaseContract extends BaseContract {
  purchase(_values: bigint[], _recipients: string[], _referrers: string[], _keyManagers: string[], _data: Uint8Array[], options?: { value: bigint }): Promise<ContractTransactionResponse>;
}

export async function deployContractsFixture({ isTest = false } = {}) {
  const [operator, upgrader, admin, user, user2, user3, user4, user5] = await ethers.getSigners();

  const [neuDeployment, storageDeployment, metadataDeployment, logoDeployment, entitlementDeployment, lockDeployment] = await deployContracts({
    isTest,
  });

  const Neu = await ethers.getContractFactory(isTest ? "NeuHarnessV3" : "NeuV3");
  const neu = Neu.attach(await neuDeployment.getAddress());

  function setNeuCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): NeuBaseContract {
    return contract.connect(runner) as NeuBaseContract;
  }

  const callNeuAs = (runner: HardhatEthersSigner) => setNeuCallerFactory(neu, runner);

  function setMetadataCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): MetadataBaseContract {
    return contract.connect(runner) as MetadataBaseContract;
  }

  const callMetadataAs = (runner: HardhatEthersSigner) => setMetadataCallerFactory(metadata, runner);

  const Metadata = await ethers.getContractFactory("NeuMetadataV3");
  const metadata = Metadata.attach(await metadataDeployment.getAddress());

  function setStorageCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): StorageBaseContract {
    return contract.connect(runner) as StorageBaseContract;
  }

  const Storage = await ethers.getContractFactory("NeuStorageV3");
  const storage = Storage.attach(await storageDeployment.getAddress());

  const callStorageAs = (runner: HardhatEthersSigner) => setStorageCallerFactory(storage, runner);

  function setEntitlementCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): EntitlementBaseContract {
    return contract.connect(runner) as EntitlementBaseContract;
  }

  const Entitlement = await ethers.getContractFactory("NeuEntitlementV1");
  const entitlement = Entitlement.attach(await entitlementDeployment.getAddress());

  const callEntitlementAs = (runner: HardhatEthersSigner) => setEntitlementCallerFactory(entitlement, runner);

  function setLockCallerFactory(contract: BaseContract, runner: HardhatEthersSigner): DaoLockBaseContract {
    return contract.connect(runner) as DaoLockBaseContract;
  }

  const Lock = await ethers.getContractFactory("NeuDaoLockV1");

  const lock = Lock.attach(await lockDeployment.getAddress());
  const callLockAs = (runner: HardhatEthersSigner) => setLockCallerFactory(lock, runner);


  const Logo = await ethers.getContractFactory("NeuLogoV2");
  const logo = Storage.attach(await logoDeployment.getAddress());

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment };
}

export async function setSeriesFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment } = await loadFixture(deployContractsFixture);

  await (await callMetadataAs(operator).addSeries(stringToBytes('WAGMI1'), 1337n * 10n ** 4n, 100001n, 1000n, 58328n, 6279n, 65153n, true)).wait();
  await (await callMetadataAs(operator).addSeries(stringToBytes('OG1'), 1337n * 10n ** 5n, 1n, 100n, 58328n, 6279n, 65153n, false)).wait();
  await (await callMetadataAs(operator).addSeries(stringToBytes('UNIQUE'), 1n, 101n, 1n, 58328n, 6279n, 65153n, true)).wait();

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId: 0n, ogId: 1n, uniqueId: 2n };
}

export async function purchasedTokensFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId } = await loadFixture(setSeriesFixture);

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

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId };
}

export async function setUserDataFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId } = await loadFixture(purchasedTokensFixture);

  await (await callStorageAs(user).saveData(100001n, userDataBytesArray[1], { value: 0n })).wait();
  await (await callStorageAs(user2).saveData(2n, userDataBytesArray[2], { value: 10n ** 14n })).wait();
  await (await callStorageAs(user3).saveData(3n, userDataBytesArray[3], { value: 10n ** 16n })).wait();
  await (await callStorageAs(user4).saveData(100004n, userDataBytesArray[4], { value: 10n ** 18n })).wait();
  await (await callStorageAs(user5).saveData(5n, userDataBytesArray[5], { value: 9n * 10n ** 20n })).wait();

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId };
}

export async function unlockFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId } = await loadFixture(setSeriesFixture);

  await unlock.deployProtocol();

  const lockArgs = {
    expirationDuration: 60 * 60 * 24 * 30, // 30 days
    currencyContractAddress: null, // null for ETH or erc20 address
    keyPrice: '100000000', // in wei
    maxNumberOfKeys: 10,
    name: 'Neulock Test Lock',
  };

  const { lock: unlockLock, lockAddress } = await unlock.createLock(lockArgs);

  const wagmi = await callMetadataAs(user).getSeries(wagmiId);

  // User - WAGMI #100001 & Lock - Day 0
  await (await callNeuAs(user).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();
  await (await (unlockLock.connect(user) as PublicUnlockBaseContract).purchase([0n], [user.address], [user.address], [user.address], [new Uint8Array()], { value: 100000000n })).wait();

  // User2 - WAGMI #100002 - Day 0
  await (await callNeuAs(user2).safeMintPublic(wagmiId, { value: seriesValue(wagmi) })).wait();

  // User3 - Lock - Day 0
  await (await (unlockLock.connect(user3) as PublicUnlockBaseContract).purchase([0n], [user3.address], [user3.address], [user3.address], [new Uint8Array()], { value: 100000000n })).wait();

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock };
}

export async function entitlementFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock } = await loadFixture(unlockFixture);

  await callEntitlementAs(operator).addEntitlementContract((await unlockLock.getAddress()) as `0x${string}`);

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock };
}

export async function daoLockFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock } = await loadFixture(entitlementFixture);

  const DaoMock = await ethers.getContractFactory("DaoMock");
  const daoMock = await DaoMock.deploy();
  await daoMock.waitForDeployment();
  const daoMockAddress = await daoMock.getAddress() as `0x${string}`;

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock, daoMockAddress };
}

export async function daoLockTokensPurchasedFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock, daoMockAddress } = await loadFixture(daoLockFixture);

  await (await callMetadataAs(operator).setSeriesAvailability(ogId, true)).wait();
  await (await callLockAs(operator).setNeuDaoAddress(daoMockAddress)).wait();

  const og = await callMetadataAs(user).getSeries(ogId);

  await (await callNeuAs(user).safeMintPublic(ogId, { value: seriesValue(og) })).wait();
  await (await callNeuAs(user).safeMintPublic(ogId, { value: seriesValue(og) })).wait();
  await (await callNeuAs(user2).safeMintPublic(ogId, { value: seriesValue(og) })).wait();
  await (await callNeuAs(user2).safeMintPublic(ogId, { value: seriesValue(og) })).wait();
  await (await callNeuAs(user3).safeMintPublic(ogId, { value: seriesValue(og) })).wait();
  await (await callNeuAs(user3).safeMintPublic(ogId, { value: seriesValue(og) })).wait();
  await (await callNeuAs(user4).safeMintPublic(ogId, { value: seriesValue(og) })).wait();
  await (await callNeuAs(user4).safeMintPublic(ogId, { value: seriesValue(og) })).wait();

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock, daoMockAddress };
}

export async function daoLockUnlockedFixture() {
  const { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock, daoMockAddress } = await loadFixture(daoLockTokensPurchasedFixture);

  const dummyData = new Uint8Array(32);

  await (await callStorageAs(user).saveData(100001n, dummyData, { value: 10n ** 15n })).wait();

  await (await callLockAs(user).unlock(1n)).wait();
  await (await callLockAs(user).unlock(2n)).wait();
  await (await callLockAs(user2).unlock(3n)).wait();
  await (await callLockAs(user2).unlock(4n)).wait();
  await (await callLockAs(user3).unlock(5n)).wait();
  await (await callLockAs(user3).unlock(6n)).wait();
  await (await callLockAs(user4).unlock(7n)).wait();
  await (await callLockAs(user4).unlock(8n)).wait();

  return { neu, metadata, storage, entitlement, lock, logo, admin, upgrader, operator, user, user2, user3, user4, user5, callNeuAs, callMetadataAs, callStorageAs, callEntitlementAs, callLockAs, neuDeployment, wagmiId, ogId, uniqueId, unlockLock, daoMockAddress };
}
