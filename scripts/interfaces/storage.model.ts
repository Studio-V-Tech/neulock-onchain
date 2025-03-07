import { BaseContract, ContractTransactionResponse } from "ethers";

import AccessControl from "./lib/access-control.model";

interface StorageBaseContract extends BaseContract, AccessControl {
  saveData(tokenId: bigint, data: Uint8Array, options?: { value: bigint }): Promise<ContractTransactionResponse>;
  retrieveData(owner: `0x${string}`): Promise<`0x${string}`>;
}

export default StorageBaseContract;