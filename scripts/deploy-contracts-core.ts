import { ethers, upgrades } from "hardhat";
import { BaseContract } from "ethers";
import traitMetadataUri from "./trait-metadata-uri";
import { Account, ChainType, ChainTypeAccount } from "./lib/config";
import { getChain, getChainType } from "./lib/utils";
import NeuBaseContract from "./interfaces/neu.model";
import StorageBaseContract from "./interfaces/storage.model";
import MetadataBaseContract from "./interfaces/metadata.model";
import EntitlementBaseContract from "./interfaces/entitlement-v2.model";

async function deployContracts({ isTest, forceOperations, forceReinitializers } : {
  isTest?: boolean,
  forceOperations?: boolean,
  forceReinitializers?: boolean,
} = {}
): Promise<[BaseContract, BaseContract, BaseContract, BaseContract, BaseContract, BaseContract]> {
  const chain = await getChain(ethers.provider);
  const chainType = await getChainType(chain);

  const adminAddress = ChainTypeAccount[chainType][Account.admin];
  const upgraderAddress = ChainTypeAccount[chainType][Account.upgrader];
  const operatorAddress = ChainTypeAccount[chainType][Account.operator];

  const Neu = await ethers.getContractFactory(isTest ? "NeuHarnessV3" : "NeuV3");
  const Metadata = await ethers.getContractFactory("NeuMetadataV3");
  const Storage = await ethers.getContractFactory("NeuStorageV3");
  const Logo = await ethers.getContractFactory("NeuLogoV2");
  const Entitlement = await ethers.getContractFactory("NeuEntitlementV2");
  const Lock = await ethers.getContractFactory("NeuDaoLockV2");

  const operatorSigner = forceOperations || chainType === ChainType.local ? await ethers.getSigner(operatorAddress) : null;
  const reinitializersSigner = forceReinitializers || chainType === ChainType.local ? await ethers.getSigner(upgraderAddress) : null;

  console.log('---');

  const logo = await Logo.deploy();
  await logo.waitForDeployment();
  const logoAddress = await logo.getAddress();
  console.log(`Neulock Logo deployed at:        ${logoAddress}`);

  const neu = await upgrades.deployProxy(Neu, [
    adminAddress,
    upgraderAddress,
    operatorAddress,
  ]);

  await neu.waitForDeployment();

  const neuAddress = await neu.getAddress();
  console.log(`NEU token deployed at:           ${neuAddress}`);

  const entitlement = await upgrades.deployProxy(Entitlement, [
    adminAddress,
    upgraderAddress,
    operatorAddress,
    neuAddress,
  ]);

  await entitlement.waitForDeployment();

  const entitlementAddress = await entitlement.getAddress();
  console.log(`Neulock Entitlement deployed at: ${entitlementAddress}`);

  const lock = await Lock.deploy(
    adminAddress,
    operatorAddress,
    neuAddress,
  );

  await lock.waitForDeployment();

  const lockAddress = await lock.getAddress();
  console.log(`Neulock DAO Lock deployed at:    ${lockAddress}`);

  const storage = await upgrades.deployProxy(Storage, [
    adminAddress,
    upgraderAddress,
    neuAddress,
  ]);

  await storage.waitForDeployment();

  const storageAddress = await storage.getAddress();
  console.log(`Neulock Storage deployed at:     ${storageAddress}`);

  const metadata = await upgrades.deployProxy(Metadata, [
    adminAddress,
    upgraderAddress,
    operatorAddress,
    neuAddress,
    logoAddress,
  ]);

  await metadata.waitForDeployment();

  const metadataAddress = await metadata.getAddress();
  console.log(`Neulock Metadata deployed at:    ${metadataAddress}`);

  console.log('---');

  if (reinitializersSigner) {
    const metadataRunner = (metadata as BaseContract).connect(reinitializersSigner) as MetadataBaseContract;

    await (await metadataRunner.initializeV3()).wait();
    console.log('Reinitialized Metadata V3: No refundable tokens remaining');

    const neuRunner = neu.connect(reinitializersSigner) as NeuBaseContract;

    await (await neuRunner.initializeV2(lockAddress as `0x${string}`)).wait();
    console.log('Reinitialized Neu V2: DAO Lock contract set on NEU token');

    await (await neuRunner.initializeV3(
      operatorAddress as `0x${string}`,
      metadataAddress as `0x${string}`,
      lockAddress as `0x${string}`,
      traitMetadataUri
    )).wait();
    console.log('Reinitialized Neu V3: Royalty receiver, Metadata contract, Lock address, and Trait Metadata URI set on NEU token');

    const storageRunner = storage.connect(reinitializersSigner) as StorageBaseContract;

    await (await storageRunner.initializeV2(entitlementAddress as `0x${string}`)).wait();
    console.log('Reinitialized Storage V2: Entitlement contract set on Storage');

    const entitlementRunner = entitlement.connect(reinitializersSigner) as EntitlementBaseContract;

    await (await entitlementRunner.initializeV2(neuAddress as `0x${string}`)).wait();
    console.log('Reinitialized Entitlement V2: NEU contract set on Entitlement');

  } else {
    console.log('IMPORTANT: Run reinitializers for Entitlement V2; Storage V2; Metadata V3; and Neu V2 and V3 now!');
  }

  console.log('---');

  return [
    neu,
    storage,
    metadata,
    logo,
    entitlement,
    lock,
  ];
}

export default deployContracts;