import { BaseContract, ContractTransactionResponse } from "ethers";

import AccessControl from "./lib/access-control.model";

interface EntitlementBaseContract extends BaseContract, AccessControl {
  entitlementContracts(index: bigint): Promise<string>;
  addEntitlementContract(entitlementContract: `0x${string}`): Promise<ContractTransactionResponse>;
  removeEntitlementContract(entitlementContract: `0x${string}`): Promise<ContractTransactionResponse>;
  hasEntitlement(user: `0x${string}`): Promise<boolean>;
  userEntitlementContracts(user: `0x${string}`): Promise<`0x${string}`[]>;
}

export default EntitlementBaseContract;
