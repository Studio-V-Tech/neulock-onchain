import { BaseContract, ContractTransactionResponse } from "ethers";

import AccessControl from "./lib/access-control.model";
import UUPSUpgradeable from "./lib/uups-upgradeable.model";

interface EntitlementBaseContract extends BaseContract, AccessControl, UUPSUpgradeable {
  initializeV2(): Promise<ContractTransactionResponse>;
  entitlementContractsV2(index: bigint): Promise<string>;
  entitlementContractsLength(): Promise<bigint>;
  addEntitlementContract(entitlementContract: `0x${string}`): Promise<ContractTransactionResponse>;
  removeEntitlementContract(entitlementContract: `0x${string}`): Promise<ContractTransactionResponse>;
  hasEntitlement(user: `0x${string}`): Promise<boolean>;
  userEntitlementContracts(user: `0x${string}`): Promise<`0x${string}`[]>;
}

export default EntitlementBaseContract;
