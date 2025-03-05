// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INeuLogo {
    function makeLogo(string calldata tokenId, string calldata seriesName, uint16 foregroundColor, uint16 backgroundColor, uint16 accentColor) external view returns (string memory);
}