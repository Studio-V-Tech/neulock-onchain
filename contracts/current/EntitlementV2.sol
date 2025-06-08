// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {INeuEntitlementV2} from "../interfaces/IEntitlementV2.sol";
import {INeuTokenV3} from "../interfaces/INeuV3.sol";

contract NeuEntitlementV2 is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    INeuEntitlementV2
{
    using EnumerableSet for EnumerableSet.AddressSet;
    uint256 private constant _VERSION = 2;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    address[] private entitlementContracts; // Deprecated in V2
    EnumerableSet.AddressSet private _entitlementContracts;
    INeuTokenV3 private _neuContract;

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
        emit InitializedEntitlement(_VERSION, defaultAdmin, upgrader, operator, neuContract);
    }

    function initializeV2() public reinitializer(2) onlyRole(UPGRADER_ROLE) {
        _neuContract = INeuTokenV3(entitlementContracts[0]);

        for (uint256 i = 1; i < entitlementContracts.length; i++) {
            // slither-disable-next-line unused-return (we only care about the side effect)
            _entitlementContracts.add(entitlementContracts[i]);
        }

        emit InitializedEntitlementV2();
    }

    function entitlementContractsV2(uint256 index) external view returns (address) {
        if (index == 0) {
            return address(_neuContract);
        }

        return _entitlementContracts.at(index - 1);
    }

    function addEntitlementContract(address entitlementContract) external onlyRole(OPERATOR_ROLE) override {
        require(_entitlementContracts.add(entitlementContract), "Entitlement contract already added");

        // We won't check for the IERC721 interface, since any token that supports balanceOf() can be used
        // slither-disable-next-line unused-return (we don't need the return value, only to check if the function exists)
        try IERC721(entitlementContract).balanceOf(address(this)) {} catch {
            revert("Contract does not support balanceOf()");
        }

        emit EntitlementContractAdded(entitlementContract);
    }

    function removeEntitlementContract(address entitlementContract) external onlyRole(OPERATOR_ROLE) override {
        require(_entitlementContracts.remove(entitlementContract), "Entitlement contract not found");

        emit EntitlementContractRemoved(entitlementContract);
    }

    function hasEntitlement(address user) external view override returns (bool) {
        if (_callerHasNeuEntitlement(user)) {
            return true;
        }

        uint256 entitlementContractsLength = _entitlementContracts.length();

        for (uint256 i = 0; i < entitlementContractsLength; i++) {
            if (_callerHasContractEntitlement(user, _entitlementContracts.at(i))) {
                return true;
            }
        }

        return false;
    }

    function hasEntitlementWithContract(address user, address entitlementContract) external view override returns (bool) {
        if (entitlementContract == address(_neuContract)) {
            return _callerHasNeuEntitlement(user);
        }

        if (_entitlementContracts.contains(entitlementContract)) {
            return _callerHasContractEntitlement(user, entitlementContract);
        }

        return false;
    }

    function userEntitlementContracts(address user) external view override returns (address[] memory) {
        uint256 entitlementContractsLength = _entitlementContracts.length();

        address[] memory userEntitlements = new address[](entitlementContractsLength + 1);
        uint256 count = 0;

        if (_callerHasNeuEntitlement(user)) {
            userEntitlements[0] = address(_neuContract);
            count++;
        }

        for (uint256 i = 0; i < entitlementContractsLength; i++) {
            address entitlementContract = _entitlementContracts.at(i);

            if (_callerHasContractEntitlement(user, entitlementContract)) {
                userEntitlements[count] = entitlementContract;
                count++;
            }
        }

        assembly {
            mstore(userEntitlements, count)
        }

        return userEntitlements;
    }

    function _callerHasContractEntitlement(address user, address contractAddress) private view returns (bool) {
        // slither-disable-next-line calls-loop (will only revert if contract has been upgraded and doesn't support balanceOf(); in this case, we don't want to fail silently)
        return IERC721(contractAddress).balanceOf(user) > 0;
    }

    function _callerHasNeuEntitlement(address user) private view returns (bool) {
        uint256 userNeuBalance = _neuContract.balanceOf(user);

        for (uint256 i = 0; i < userNeuBalance; i++) {
            uint256 tokenId = _neuContract.tokenOfOwnerByIndex(user, i);

            // slither-disable-next-line block-timestamp (with a granularity of days for the entitlement cooldown, we can tolerate miner manipulation)
            if (block.timestamp >= _neuContract.entitlementAfterTimestamps(tokenId)) {
                return true;
            }
        }

        return false;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}
