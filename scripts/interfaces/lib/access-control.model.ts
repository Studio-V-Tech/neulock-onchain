import { ContractTransactionResponse } from "ethers";

interface AccessControl {
  hasRole(role: `0x${string}`, account: `0x${string}`): Promise<boolean>;
  grantRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  revokeRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  getRoleAdmin(role: `0x${string}`): Promise<`0x${string}`>;
}

export default AccessControl;