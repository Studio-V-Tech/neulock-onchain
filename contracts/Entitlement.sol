// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.27;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

import {INeuEntitlement} from "./interfaces/IEntitlement.sol";

contract NeuEntitlement is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    INeuEntitlement
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    address[] public override entitlementContracts;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address defaultAdmin,
        address upgrader,
        address operator,
        address neuContract
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, upgrader);
        _grantRole(OPERATOR_ROLE, operator);

        entitlementContracts.push(neuContract);
    }

    function addEntitlementContract(address entitlementContract) external onlyRole(OPERATOR_ROLE) override {
        for (uint256 i = 0; i < entitlementContracts.length; i++) {
            require(entitlementContracts[i] != entitlementContract, "Entitlement contract already added");
        }

        // We won't check for the IERC721 interface, since any token that supports balanceOf() can be used
        try IERC721(entitlementContract).balanceOf(address(this)) {} catch {
            revert("Entitlement contract does not support balanceOf()");
        }

        entitlementContracts.push(entitlementContract);
    }

    function removeEntitlementContract(address entitlementContract) external onlyRole(OPERATOR_ROLE) override {
        for (uint256 i = 0; i < entitlementContracts.length; i++) {
            if (entitlementContracts[i] == entitlementContract) {
                entitlementContracts[i] = entitlementContracts[entitlementContracts.length - 1];
                entitlementContracts.pop();
                return;
            }
        }

        revert("Entitlement contract not found");
    }

    function hasEntitlement(address user) external view override returns (bool) {
        for (uint256 i = 0; i < entitlementContracts.length; i++) {
            IERC721 entitlementContract = IERC721(entitlementContracts[i]);
              if (entitlementContract.balanceOf(user) > 0) {
                  return true;
              }
        }

        return false;
    }

    function userEntitlementContracts(address user) external view override returns (address[] memory) {
        address[] memory userEntitlements = new address[](entitlementContracts.length);
        uint256 count = 0;

        for (uint256 i = 0; i < entitlementContracts.length; i++) {
            IERC721 entitlementContract = IERC721(entitlementContracts[i]);
            if (entitlementContract.balanceOf(user) > 0) {
                userEntitlements[count] = entitlementContracts[i];
                count++;
            }
        }

        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userEntitlements[i];
        }

        return result;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}
