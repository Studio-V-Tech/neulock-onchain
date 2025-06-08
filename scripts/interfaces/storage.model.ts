import { BaseContract, ContractTransactionResponse } from "ethers";

import AccessControl from "./lib/access-control.model";
import UUPSUpgradeable from "./lib/uups-upgradeable.model";

interface StorageBaseContract extends BaseContract, AccessControl, UUPSUpgradeable {
  initializeV2(entitlement: `0x${string}`): Promise<ContractTransactionResponse>;
  saveData(tokenId: bigint, data: Uint8Array, options?: { value: bigint }): Promise<ContractTransactionResponse>;
  saveDataV3(entitlementContract: `0x${string}`, data: Uint8Array): Promise<ContractTransactionResponse>;
  retrieveData(owner: `0x${string}`): Promise<`0x${string}`>;
}

export default StorageBaseContract;