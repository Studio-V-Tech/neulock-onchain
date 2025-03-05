// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INeuStorage {
    function saveData(uint256 tokenId, bytes memory data) external payable;
    function retrieveData(address owner) external view returns (bytes memory);
}
