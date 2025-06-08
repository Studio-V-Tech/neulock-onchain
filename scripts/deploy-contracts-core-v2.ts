import { ethers, upgrades } from "hardhat";
import { BaseContract } from "ethers";
import traitMetadataUri from "./trait-metadata-uri";
import NeuBaseContract from "../scripts/interfaces/neu.model";
import { Account, ChainType, ChainTypeAccount } from "./lib/config";
import { getChain, getChainType } from "./lib/utils";

async function deployContracts({ isTest, forceOperations } : {
  isTest?: boolean,
  forceOperations?: boolean,
} = {}
): Promise<[BaseContract, BaseContract, BaseContract, BaseContract, BaseContract, BaseContract]> {
  const chain = await getChain(ethers.provider);
  const chainType = await getChainType(chain);

  const adminAddress = ChainTypeAccount[chainType][Account.admin];
  const upgraderAddress = ChainTypeAccount[chainType][Account.upgrader];
  const operatorAddress = ChainTypeAccount[chainType][Account.operator];

  const Neu = await ethers.getContractFactory(isTest ? "NeuHarnessV2" : "NeuV2");
  const Metadata = await ethers.getContractFactory("NeuMetadataV2");
  const Storage = await ethers.getContractFactory("NeuStorageV2");
  const Logo = await ethers.getContractFactory("NeuLogoV2");
  const Entitlement = await ethers.getContractFactory("NeuEntitlementV1");
  const Lock = await ethers.getContractFactory("NeuDaoLockV1");

  const operatorSigner = forceOperations || chainType === ChainType.local ? await ethers.getSigner(operatorAddress) : null;

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
    entitlementAddress,
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

  if (operatorSigner) {
    const neuRunner = neu.connect(operatorSigner) as NeuBaseContract;

    await (await neuRunner.setMetadataContract(metadataAddress as `0x${string}`)).wait();
    console.log('Metadata contract set on NEU token');
    await (await neuRunner.setDaoLockContract(lockAddress as `0x${string}`)).wait();
    console.log('DAO Lock contract set on NEU token');
    await (await neuRunner.setStorageContract(storageAddress as `0x${string}`)).wait();
    console.log('Storage contract set on NEU token');
    await (await neuRunner.setTraitMetadataURI(traitMetadataUri)).wait();
    console.log('Trait metadata URI set on NEU token');
  } else {
    console.log('IMPORTANT: Update contract addresses in lib/config.ts now!');
    console.log('Then, generate transactions for the NEU contract by calling deploy-contracts-tx.ts with the appropriate STEP env variable: 1, 2 and 3, like so:');
    console.log('STEP=1 npx hardhat run scripts/deploy-contracts-tx.ts --network <network>');
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