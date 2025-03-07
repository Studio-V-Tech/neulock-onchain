import { ethers, upgrades } from "hardhat";
import { BaseContract } from "ethers";
import traitMetadataUri from "./trait-metadata-uri";
import NeuBaseContract from "../scripts/interfaces/neu.model";
import { Account, ChainType, ChainTypeAccount } from "./lib/config";
import { getChain, getChainType } from "./lib/utils";

async function deployContractsV1({ isTest } : { isTest?: boolean } = {}
): Promise<[BaseContract, BaseContract, BaseContract, BaseContract, BaseContract]> {
  const chain = await getChain(ethers.provider);
  const chainType = await getChainType(chain);

  const adminAddress = ChainTypeAccount[chainType][Account.admin];
  const upgraderAddress = ChainTypeAccount[chainType][Account.upgrader];
  const operatorAddress = ChainTypeAccount[chainType][Account.operator];

  const Neu = await ethers.getContractFactory(isTest ? "NeuHarness" : "Neu");
  const Metadata = await ethers.getContractFactory("NeuMetadata");
  const Storage = await ethers.getContractFactory("NeuStorage");
  const Logo = await ethers.getContractFactory("NeuLogo");
  const Entitlement = await ethers.getContractFactory("NeuEntitlement");

  let operatorSigner = chainType === ChainType.local ? await ethers.getSigner(operatorAddress) : null;

  const logo = await Logo.deploy();
  await logo.waitForDeployment();
  const logoAddress = await logo.getAddress();

  const neu = await upgrades.deployProxy(Neu, [
    adminAddress,
    upgraderAddress,
    operatorAddress,
  ]);

  await neu.waitForDeployment();

  const neuAddress = await neu.getAddress();

  const entitlement = await upgrades.deployProxy(Entitlement, [
    adminAddress,
    upgraderAddress,
    operatorAddress,
    neuAddress,
  ]);

  await entitlement.waitForDeployment();

  const storage = await upgrades.deployProxy(Storage, [
    adminAddress,
    upgraderAddress,
    neuAddress,
  ]);

  await storage.waitForDeployment();

  const storageAddress = await storage.getAddress();

  const metadata = await upgrades.deployProxy(Metadata, [
    adminAddress,
    upgraderAddress,
    operatorAddress,
    neuAddress,
    logoAddress,
  ]);

  await metadata.waitForDeployment();

  const metadataAddress = await metadata.getAddress();

  if (operatorSigner) {
    const neuRunner = neu.connect(operatorSigner) as NeuBaseContract;

    await (await neuRunner.setMetadataContract(metadataAddress as `0x${string}`)).wait();
    await (await neuRunner.setStorageContract(storageAddress as `0x${string}`)).wait();
    await (await neuRunner.setTraitMetadataURI(traitMetadataUri)).wait();
  }

  return [
    neu,
    storage,
    metadata,
    logo,
    entitlement,
  ];
}

export default deployContractsV1;