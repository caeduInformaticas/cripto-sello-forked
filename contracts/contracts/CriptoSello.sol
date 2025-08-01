// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CriptoSello is ERC721, Ownable {
    enum PropertyState { IN_NOTARY, VALIDATED, REGISTERED }

    struct Property {
        string ownerInfo;
        string details;
        string legalDocsHash;
        PropertyState state;
        bool exists;
    }

    mapping(uint256 => Property) public properties;
    mapping(address => bool) public notaries;
    address public ddrrAddress;

    event PropertyRegistered(uint256 indexed tokenId, address indexed owner, string ownerInfo, string details, string legalDocsHash);
    event PropertyStateChanged(uint256 indexed tokenId, PropertyState newState);
    event NotaryAdded(address indexed notary);
    event NotaryRemoved(address indexed notary);

    constructor(address _ddrrAddress) ERC721("CriptoSelloProperty", "CSP") Ownable(msg.sender) {
        ddrrAddress = _ddrrAddress;
    }

    modifier onlyNotary() {
        require(notaries[msg.sender], "Caller is not a notary");
        _;
    }

    modifier onlyDDRR() {
        require(msg.sender == ddrrAddress, "Caller is not DDRR");
        _;
    }

    // Helper function to check if a token exists
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return properties[tokenId].exists;
    }

    function createProperty(address _to, uint256 _tokenId, string memory _ownerInfo, string memory _details, string memory _legalDocsHash) public onlyNotary {
        require(!_tokenExists(_tokenId), "Property already exists");
        
        _mint(_to, _tokenId);
        
        properties[_tokenId] = Property({
            ownerInfo: _ownerInfo,
            details: _details,
            legalDocsHash: _legalDocsHash,
            state: PropertyState.IN_NOTARY,
            exists: true
        });
        
        emit PropertyRegistered(_tokenId, _to, _ownerInfo, _details, _legalDocsHash);
    }

    function validateProperty(uint256 _tokenId) public onlyNotary {
        require(_tokenExists(_tokenId), "Property does not exist");
        require(properties[_tokenId].state == PropertyState.IN_NOTARY, "Property is not in IN_NOTARY state");
        properties[_tokenId].state = PropertyState.VALIDATED;
        emit PropertyStateChanged(_tokenId, PropertyState.VALIDATED);
    }

    function registerProperty(uint256 _tokenId) public onlyDDRR {
        require(_tokenExists(_tokenId), "Property does not exist");
        require(properties[_tokenId].state == PropertyState.VALIDATED, "Property is not in VALIDATED state");
        properties[_tokenId].state = PropertyState.REGISTERED;
        emit PropertyStateChanged(_tokenId, PropertyState.REGISTERED);
    }

    function getProperty(uint256 _tokenId) public view returns (Property memory) {
        require(_tokenExists(_tokenId), "Property does not exist");
        return properties[_tokenId];
    }

    function addNotary(address _notary) public onlyOwner {
        notaries[_notary] = true;
        emit NotaryAdded(_notary);
    }

    function removeNotary(address _notary) public onlyOwner {
        notaries[_notary] = false;
        emit NotaryRemoved(_notary);
    }

    function setDDRRAddress(address _ddrrAddress) public onlyOwner {
        ddrrAddress = _ddrrAddress;
    }
}

