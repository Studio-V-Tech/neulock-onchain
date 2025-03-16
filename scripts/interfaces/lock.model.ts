import { BaseContract, ContractTransactionResponse } from "ethers";

import AccessControl from "./lib/access-control.model";

interface DaoLockBaseContract extends BaseContract, AccessControl {
  neuDaoAddress(): Promise<string>;
  keyTokenIds(index: bigint): Promise<bigint>;
  setNeuDaoAddress(newNeoDaoAddress: `0x${string}`): Promise<ContractTransactionResponse>;
  unlock(neuTokenId: bigint): Promise<ContractTransactionResponse>;
  cancelUnlock(neuTokenId: bigint): Promise<ContractTransactionResponse>;
  withdraw(): Promise<ContractTransactionResponse>;
}

export default DaoLockBaseContract;