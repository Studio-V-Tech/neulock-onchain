// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

import {INeuEntitlementV2} from "../interfaces/IEntitlementV2.sol";
import {INeuTokenV3} from "../interfaces/INeuV3.sol";

contract NeuEntitlementV2 is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    INeuEntitlementV2
{
    uint256 private constant VERSION = 2;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    address[] public entitlementContracts;

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

        emit EntitlementContractAdded(neuContract);
        emit InitializedEntitlement(VERSION, defaultAdmin, upgrader, operator, neuContract);
    }

    function addEntitlementContract(address entitlementContract) external onlyRole(OPERATOR_ROLE) override {
        uint256 entitlementContractsLength = entitlementContracts.length;

        for (uint256 i = 0; i < entitlementContractsLength; i++) {
            require(entitlementContracts[i] != entitlementContract, "Entitlement contract already added");
        }

        // We won't check for the IERC721 interface, since any token that supports balanceOf() can be used
        // slither-disable-next-line unused-return (we don't need the return value, only to check if the function exists)
        try IERC721(entitlementContract).balanceOf(address(this)) {} catch {
            revert("Contract does not support balanceOf()");
        }

        entitlementContracts.push(entitlementContract);

        emit EntitlementContractAdded(entitlementContract);
    }

    function removeEntitlementContract(address entitlementContract) external onlyRole(OPERATOR_ROLE) override {
        // Disallow removing the first contract (neuContract, as per the initializer)
        for (uint256 i = 1; i < entitlementContracts.length; i++) {
            if (entitlementContracts[i] == entitlementContract) {
                entitlementContracts[i] = entitlementContracts[entitlementContracts.length - 1];
                // slither-disable-next-line costly-loop (we only pop once and return)
                entitlementContracts.pop();

                emit EntitlementContractRemoved(entitlementContract);
                return;
            }
        }

        revert("Entitlement contract not found");
    }

    function hasEntitlement(address user) external view override returns (bool) {
        if (_callerHasNeuEntitlement(user)) {
            return true;
        }

        uint256 entitlementContractsLength = entitlementContracts.length;

        for (uint256 i = 1; i < entitlementContractsLength; i++) {
            IERC721 entitlementContract = IERC721(entitlementContracts[i]);

            if (_callerHasContractEntitlement(user, entitlementContract)) {
                return true;
            }
        }

        return false;
    }

    function userEntitlementContracts(address user) external view override returns (address[] memory) {
        address[] memory userEntitlements = new address[](entitlementContracts.length);
        uint256 count = 0;

        uint256 entitlementContractsLength = entitlementContracts.length;

        if (_callerHasNeuEntitlement(user)) {
            userEntitlements[0] = entitlementContracts[0];
            count++;
        }

        for (uint256 i = 1; i < entitlementContractsLength; i++) {
            IERC721 entitlementContract = IERC721(entitlementContracts[i]);

            if (_callerHasContractEntitlement(user, entitlementContract)) {
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

    function _callerHasContractEntitlement(address user, IERC721 entitlementContract) private view returns (bool) {
        // slither-disable-next-line calls-loop (will only revert if contract has been upgraded and doesn't support balanceOf(); in this case, we don't want to fail silently)
        return entitlementContract.balanceOf(user) > 0;
    }

    function _callerHasNeuEntitlement(address user) private view returns (bool) {
        INeuTokenV3 neuContract = INeuTokenV3(entitlementContracts[0]);
        uint256 userNeuBalance = neuContract.balanceOf(user);

        for (uint256 i = 0; i < userNeuBalance; i++) {
            uint256 tokenId = neuContract.tokenOfOwnerByIndex(user, i);

            if (block.timestamp >= neuContract.entitlementAfterTimestamps(tokenId)) {
                return true;
            }
        }

        return false;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}
