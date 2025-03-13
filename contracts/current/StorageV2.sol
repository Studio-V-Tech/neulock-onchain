// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {INeuStorageV1} from "../interfaces/INeuStorageV1.sol";
import {INeuV1} from "../interfaces/INeuV1.sol";
import {INeuEntitlementV1} from "../interfaces/IEntitlementV1.sol";

interface INeuToken is INeuV1, IERC721 {}

contract NeuStorageV2 is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    INeuStorageV1
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    INeuToken private _neuContract;
    mapping(address => bytes) private _userdata;
    INeuEntitlementV1 private _entitlementContract;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address defaultAdmin,
        address upgrader,
        address neuContractAddress,
        address entitlementContractAddress
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, upgrader);

        _neuContract = INeuToken(neuContractAddress);
        _entitlementContract = INeuEntitlementV1(entitlementContractAddress);
    }

    function initializeV2(address _entitlementContractAddress) public reinitializer(2) {
        _entitlementContract = INeuEntitlementV1(_entitlementContractAddress);
    }

    function saveData(uint256 tokenId, bytes memory data) external payable {
        // Call with tokenId = 0 if entitlement by token other than the NEU
        require(_entitlementContract.hasEntitlement(msg.sender), "Caller does not have entitlement");

        if (msg.value > 0 && _neuContract.ownerOf(tokenId) == msg.sender) {
            _neuContract.increaseSponsorPoints{value: msg.value}(tokenId);
        }

        _userdata[msg.sender] = data;
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

