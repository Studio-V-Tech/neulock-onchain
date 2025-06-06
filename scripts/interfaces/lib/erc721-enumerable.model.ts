import ERC721 from "./erc721.model";

interface ERC721Enumerable extends ERC721 {
  totalSupply(): Promise<bigint>;
  tokenOfOwnerByIndex(owner: `0x${string}`, index: bigint): Promise<bigint>;
  tokenByIndex(index: bigint): Promise<bigint>;
}

export default ERC721Enumerable;