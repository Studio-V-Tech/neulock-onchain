import { ContractTransactionResponse } from "ethers";

interface UUPSUpgradeable {
  proxiableUUID(): Promise<string>;
  upgradeToAndCall(newImplementation: `0x${string}`, data: Uint8Array): Promise<ContractTransactionResponse>;
}

export default UUPSUpgradeable;