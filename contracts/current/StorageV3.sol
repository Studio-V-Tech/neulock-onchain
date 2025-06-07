// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import {INeuStorageV3} from "../interfaces/INeuStorageV3.sol";
import {INeuV3, INeuTokenV3} from "../interfaces/INeuV3.sol";
import {INeuEntitlementV2} from "../interfaces/IEntitlementV2.sol";

contract NeuStorageV3 is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    INeuStorageV3
{
    uint256 private constant _VERSION = 3;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    INeuTokenV3 private _neuContract;
    mapping(address => bytes) private _userdata;
    INeuEntitlementV2 private _entitlementContract;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address defaultAdmin,
        address upgrader,
        address neuContractAddress
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, upgrader);

        _neuContract = INeuTokenV3(neuContractAddress);

        emit InitializedStorage(_VERSION, defaultAdmin, upgrader, neuContractAddress);
    }

    function initializeV2(address entitlementContractAddress) public reinitializer(2) onlyRole(UPGRADER_ROLE) {
        _entitlementContract = INeuEntitlementV2(entitlementContractAddress);

        emit InitializedStorageV2(entitlementContractAddress);
    }

    function saveData(uint256 tokenId, bytes memory data) external payable {
        // Call with tokenId = 0 if entitlement by token other than the NEU
        require(_entitlementContract.hasEntitlement(msg.sender), "Caller does not have entitlement");
        require(msg.value == 0 || _neuContract.ownerOf(tokenId) == msg.sender, "Cannot add points to unowned NEU");

        _userdata[msg.sender] = data;

        emit DataSaved(tokenId, data);

        if (msg.value > 0) {
            // slither-disable-next-line unused-return (we make this call only for the side effect)
            _neuContract.increaseSponsorPoints{value: msg.value}(tokenId);
        }
    }

    function retrieveData(address owner) external view returns (bytes memory) {
        return _userdata[owner];
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}

