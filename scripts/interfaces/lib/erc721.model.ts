import { ContractTransactionResponse } from "ethers";

interface ERC721 {
  balanceOf(owner: `0x${string}`): Promise<bigint>;
  ownerOf(token: bigint): Promise<`0x${string}`>;
  safeTransferFrom(from: `0x${string}`, to: `0x${string}`, token: bigint, data: `0x${string}`): Promise<ContractTransactionResponse>;
  safeTransferFrom(from: `0x${string}`, to: `0x${string}`, token: bigint): Promise<ContractTransactionResponse>;
  transferFrom(from: `0x${string}`, to: `0x${string}`, token: bigint): Promise<ContractTransactionResponse>;
  approve(to: `0x${string}`, token: bigint): Promise<ContractTransactionResponse>;
  setApprovalForAll(operator: `0x${string}`, approved: boolean): Promise<ContractTransactionResponse>;
  getApproved(token: bigint): Promise<`0x${string}`>;
  isApprovedForAll(owner: `0x${string}`, operator: `0x${string}`): Promise<boolean>;
}

export default ERC721;
