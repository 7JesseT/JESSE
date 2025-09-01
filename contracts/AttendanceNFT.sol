// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract AttendanceNFT is ERC1155, Ownable, ERC1155Supply {
    string public name = "Base Daily Attendance";
    string public symbol = "BDA";
    
    // Mapping to track if an address has minted today
    mapping(address => mapping(uint256 => bool)) public hasMintedToday;
    
    constructor(address initialOwner) 
        ERC1155("https://your-domain.com/api/metadata/{id}.json") 
        Ownable(initialOwner) 
    {}

    function mint(address to, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        // Optional: Add daily minting limit
        // require(!hasMintedToday[to][getCurrentDay()], "Already minted today");
        
        _mint(to, id, amount, data);
        
        // Mark as minted for today
        // hasMintedToday[to][getCurrentDay()] = true;
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 86400; // 86400 seconds in a day
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
