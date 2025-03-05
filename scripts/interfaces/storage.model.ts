import { BaseContract, ContractTransactionResponse } from "ethers";

interface StorageBaseContract extends BaseContract {
  // NeuStorage
  saveData(tokenId: bigint, data: Uint8Array, options?: { value: bigint }): Promise<ContractTransactionResponse>;
  retrieveData(owner: `0x${string}`): Promise<`0x${string}`>;
  // AccessControl
  hasRole(role: `0x${string}`, account: `0x${string}`): Promise<boolean>;
  grantRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  revokeRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  getRoleAdmin(role: `0x${string}`): Promise<`0x${string}`>;
}

export default StorageBaseContract;