import { BaseContract, ContractTransactionResponse } from "ethers";

interface EntitlementBaseContract extends BaseContract {
  // NeuEntitlement
  entitlementContracts(index: bigint): Promise<string>;
  addEntitlementContract(entitlementContract: `0x${string}`): Promise<ContractTransactionResponse>;
  removeEntitlementContract(entitlementContract: `0x${string}`): Promise<ContractTransactionResponse>;
  hasEntitlement(user: `0x${string}`): Promise<boolean>;
  userEntitlementContracts(user: `0x${string}`): Promise<`0x${string}`[]>;
  // AccessControl
  hasRole(role: `0x${string}`, account: `0x${string}`): Promise<boolean>;
  grantRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  revokeRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  getRoleAdmin(role: `0x${string}`): Promise<`0x${string}`>;
}

export default EntitlementBaseContract;
