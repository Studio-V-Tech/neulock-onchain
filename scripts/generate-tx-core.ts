import { ethers } from 'hardhat';
import { Account, Contract, ChainContractAddress, ChainTypeAccount } from './lib/config';
import { getChain, getChainType } from './lib/utils';

export async function generateTx({ contract, functionName, funcArgs, value, contractAddressOverride, count = 1 }: {
  contract: Contract,
  functionName: string,
  funcArgs: any[],
  value?: bigint | null,
  contractAddressOverride?: string | null,
  count?: number,
}) {
  console.log(`Generating ${count} transaction${count === 1 ? '' : 's'} for ${contract}.${functionName} with args: ${funcArgs.join(', ')}`);
  const params = value ? [...funcArgs, { value }] : funcArgs;

  const chain = await getChain(ethers.provider);
  const chainType = await getChainType(chain);
  const operator = ChainTypeAccount[chainType][Account.operator];

  const ContractFactory = (await ethers.getContractFactory(contract))
    .connect(new ethers.VoidSigner(operator, ethers.provider));

  const contractAddress = contractAddressOverride || ChainContractAddress[chain][contract];
  const ethersContract = ContractFactory.attach(contractAddress);
  
  const [nonce, feeData, gas, popTx] = await Promise.all([
    ethers.provider.getTransactionCount(operator),
    ethers.provider.getFeeData(),
    //@ts-ignore
    ethersContract[functionName].estimateGas(...params),
    //@ts-ignore
    ethersContract[functionName].populateTransaction(...params),
  ]);

  const txArray = [];

  for (let i = 0; i < count; i++) {
    const tx = ethers.Transaction.from({
      to: popTx.to,
      data: popTx.data,
      value: popTx.value,
      gasLimit: gas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      maxFeePerGas: feeData.maxFeePerGas,
      nonce: nonce + i,
      chainId: chain,
      type: 2,
    });

    txArray.push(tx);

    console.log('Transaction JSON:');
    console.dir(tx.toJSON());
    console.log('');
    console.log('Transaction serialized:');
    console.log(tx.unsignedSerialized);
  }

  if (count > 1) {
    console.log('');
    console.log(`Generated ${count} transactions:`);
    console.log(txArray.map(tx => tx.unsignedSerialized).join(','));
  }
}