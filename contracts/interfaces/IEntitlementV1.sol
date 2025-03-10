// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

interface INeuEntitlementV1 {
    function entitlementContracts(uint index) external view returns (address);
    function addEntitlementContract(address entitlementContract) external;
    function removeEntitlementContract(address entitlementContract) external;
    function hasEntitlement(address user) external view returns (bool);
    function userEntitlementContracts(address user) external view returns (address[] memory);
}