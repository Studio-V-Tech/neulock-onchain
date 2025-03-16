import { ethers } from "hardhat";
import MetadataBaseContract from "./interfaces/metadata.model";
import { getChain, getChainType, stringToBytes } from "./lib/utils";
import { Account, ChainTypeAccount, ChainContractAddress, Contract } from "./lib/config";

export default async function addSeries() {
  const chain = await getChain(ethers.provider);
  const chainType = await getChainType(chain);
  const metadataAddress = ChainContractAddress[chain][Contract.metadata];
  const operatorAddress = ChainTypeAccount[chainType][Account.operator];

  const Metadata = await ethers.getContractFactory("NeuMetadataV2");
  const metadata = Metadata.attach(metadataAddress);
  const callAsOperator = metadata.connect(await ethers.getSigner(operatorAddress)) as MetadataBaseContract;

  await (await callAsOperator.addSeries(stringToBytes('OG'), 10n ** 7n, 1n, 9n, 65535n, 0n, 0n, true)).wait();
  await (await callAsOperator.addSeries(stringToBytes('WAGMI1'), 1337n * 10n ** 3n, 1000n, 100n, 58328n, 6279n, 65153n, true)).wait();
}
