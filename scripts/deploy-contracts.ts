import deployContracts from "./deploy-contracts-core";

async function main() {
  await deployContracts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});