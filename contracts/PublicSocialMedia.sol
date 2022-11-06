//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0; // liscense is compulsory for compiler to compile the smart contract.

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // importing openzeppelin smart contract used to create non-fungible-tokens.

contract PublicSocialMedia is
    ERC721URIStorage // inheriting the erc... cotract in current contract.
{
    uint256 public tokenCount;
    uint256 public postCount;

    mapping(uint256 => Post) public posts;
    // address to nft id
    mapping(address => uint256) public profiles;
    struct Post {
        uint256 id;
        string hash;
        uint256 tipAmount;
        address payable author;
    }

    event PostCreated(
        uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author
    );
    event PostTipped(
        uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author
    );

    constructor() ERC721("PublicSocialMedia", "PSM") {} // first we are calling constructor for this contract and inside it we are calling constructor for ERC721URI... contract and it takes two arguments name of nft and it symbol.

    function mint(string memory _tokenURI) external returns (uint256) {
        // memory is used for non premitive data types(strings, bytes and arrays) because these are not state variables and will not stored in storage. in memory they will stay until this function persists only. and storage variabes consumes so much gas to again and again take from storage and sotre again in storage.
        tokenCount++;
        _safeMint(msg.sender, tokenCount); // internal function provided by ERC721 contract. It transfers the token id to address passed in nft creation.
        _setTokenURI(tokenCount, _tokenURI);
        setProfile(tokenCount);
        return tokenCount;
    }

    function setProfile(uint256 _id) public {
        require(ownerOf(_id) == msg.sender, "NFT should be owned by you."); // ownerOf method is coming from ERC721 contract and is used to get the address of account inked with id.
        profiles[msg.sender] = _id;
    }

    function uploadPost(string memory _postHash) external {
        // check that if user has any nft or not
        require(balanceOf(msg.sender) > 0, "Kindly create an NFT to post");
        // check if post hash is non empty
        require(
            bytes(_postHash).length > 0,
            "Hash of the post can not be empty"
        );
        // now increment the post count
        postCount++;
        // let's now add the post to the contract
        posts[postCount] = Post(postCount, _postHash, 0, payable(msg.sender));
        emit PostCreated(postCount, _postHash, 0, payable(msg.sender));
    }

    function tipPostOwner(uint256 _id) external payable {
        // check if id is valid
        require(_id > 0 && _id <= postCount, "ID is not valid");
        // fetch the post
        Post memory _post = posts[_id];
        // check if the author is different than tipper
        require(
            _post.author != msg.sender,
            "You can not give tip to your post"
        );

        _post.author.transfer(msg.value);
        _post.tipAmount += msg.value;

        // now update the original post
        posts[_id] = _post;
        emit PostTipped(_id, _post.hash, _post.tipAmount, _post.author);
    }

    function getAllPosts() external view returns (Post[] memory _posts) {
        _posts = new Post[](postCount);
        for (uint256 i = 0; i < _posts.length; i++) {
            _posts[i] = posts[i + 1]; // because postCount is working as id of posts and starting with 1.
        }
    }

    function getMyNFTs() external view returns (uint256[] memory _ids) {
        _ids = new uint256[](balanceOf(msg.sender)); // we initialize the array in solidity by new keyword;
        uint256 currentIndex = 0;
        uint256 _tokenCount = tokenCount;
        for (uint256 i = 0; i < _tokenCount; i++) {
            if (ownerOf(i + 1) == msg.sender) {
                _ids[currentIndex++] = i + 1;
            }
        }
    }
}
