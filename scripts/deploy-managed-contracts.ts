import deployManagedContracts from "./deploy-managed-contracts-core";

async function main() {
  await deployManagedContracts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});