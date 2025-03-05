// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.27;

interface INeuStorage {
    function saveData(uint256 tokenId, bytes memory data) external payable;
    function retrieveData(address owner) external view returns (bytes memory);
}
