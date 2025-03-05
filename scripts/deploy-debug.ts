import deployContracts from "./deploy-contracts-core";
import addSeries from "./add-series-core";

async function main() {
  const [neu, storage, metadata, logo] = await deployContracts();

  const metadataAddress = await metadata.getAddress() as `0x${string}`;

  await addSeries();

  console.log('');
  console.log(`NEU token deployed at:        ${await neu.getAddress()}`);
  console.log(`Neulock Storage deployed at:  ${await storage.getAddress()}`);
  console.log(`Neulock Metadata deployed at: ${metadataAddress}`);
  console.log(`Neulock Logo deployed at:     ${await logo.getAddress()}`);

  console.log('');
  console.log("Series added successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
