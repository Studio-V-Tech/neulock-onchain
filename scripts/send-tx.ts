import { ethers } from 'hardhat';

async function main() {
  if (!process.env.TX) {
    console.error('ERROR: Set env variable TX to the signed transaction hex string comma-separated list.');
    process.exit(1);
  }

  const txs = process.env.TX.split(',');

  console.log(`Sending ${txs.length} transaction${txs.length === 1 ? '' : 's'}...`);

  for (const tx of txs) {
    const txReceipt = await (await ethers.provider.broadcastTransaction(tx)).wait();

    if (txReceipt == null || txReceipt.status !== 1) {
      console.error('ERROR: Transaction failed to mine.');
      console.error(txReceipt);
      process.exit(1);
    }

    console.log('Transaction mined with hash: ', txReceipt!.hash);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});