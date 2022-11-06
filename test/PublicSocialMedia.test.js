const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PublicSocialMedia", function () {
    let publicSocialMedia;
    let URI = "SampleURI";
    let deployer, user1, user2, users;
    let postHash = "SampleHash";

    beforeEach(async () => {
        [deployer, user1, user2, ...users] = await ethers.getSigners();
        const PubilcSocialMediaContractFactory =
            await ethers.getContractFactory("PublicSocialMedia");
        publicSocialMedia = await PubilcSocialMediaContractFactory.deploy();
        // minting an NFT for user1;
        await publicSocialMedia.connect(user1).mint(URI);
    });
    describe("Deployment", async () => {
        it("should track name and symbol", async () => {
            const nftName = "PublicSocialMedia";
            const nftSymbol = "PSM";
            expect(await publicSocialMedia.name()).to.equal(nftName);
            expect(await publicSocialMedia.symbol()).to.equal(nftSymbol);
        });
    });
    describe("Minting NFTs", async () => {
        it("should track each minted NFT", async () => {
            expect(await publicSocialMedia.tokenCount()).to.equal(1);
            expect(await publicSocialMedia.balanceOf(user1.address)).to.equal(
                1
            ); // balanceOf is member of ERC721 contract and tells how many nft accounts a particular account holds.
            expect(await publicSocialMedia.tokenURI(1)).to.equal(URI); // tokenURI is also member of ERC721 contract and tells the URI linked with token id/count.

            // test for user2
            await publicSocialMedia.connect(user2).mint(URI);
            expect(await publicSocialMedia.tokenCount()).to.equal(2);
            expect(await publicSocialMedia.balanceOf(user2.address)).to.equal(
                1
            );
            expect(await publicSocialMedia.tokenURI(2)).to.equal(URI);
        });
    });
    describe("Setting profiles", async () => {
        it("should allow users to select which NFT they own to represent their profile", async () => {
            await publicSocialMedia.connect(user1).mint(URI); // user1 now minted the second NFT for itself. first is minted in beforeEach.
            expect(await publicSocialMedia.profiles(user1.address)).to.equal(2); // by default the user profile is set to the last minted nft.
            await publicSocialMedia.connect(user1).setProfile(1); // here user1 has set the first NFT as it's profile NFT.
            expect(await publicSocialMedia.profiles(user1.address)).to.equal(1);
            // // Fail case:
            expect(
                publicSocialMedia.connect(user2).setProfile(1)
            ).to.be.revertedWith("NFT should be owned by you."); // if await is used in contract function then error is thrown.
        });
    });
    describe("uploading post", async () => {
        it("should track posts upload is done by only users who own NFT", async () => {
            // user1 uploads a post
            const user1Contract = await publicSocialMedia.connect(user1);
            expect(await user1Contract.uploadPost(postHash))
                .to.emit(publicSocialMedia, "postCreated")
                .withArgs(1, postHash, 0, user1.address);
            const postCount = await publicSocialMedia.postCount();
            expect(postCount).to.equal(1);

            // check from struct;
            const _post = await publicSocialMedia.posts(postCount);
            expect(_post.id).to.equal(1);
            expect(_post.hash).to.equal(postHash);
            expect(_post.tipAmount).to.equal(0);
            expect(_post.author).to.equal(user1.address);

            //fail case:1
            // trying to post without creating NFT
            expect(
                publicSocialMedia.connect(user2).uploadPost(postHash)
            ).to.revertedWith("Kindly create an NFT to post");
            //fail case:2
            // trying to post with empty hash
            expect(
                publicSocialMedia.connect(user1).uploadPost("")
            ).to.revertedWith("Hash of the post can not be empty");
        });
    });
    describe("Tipping posts", () => {
        it("should allow users to tip posts and track tip amount", async () => {
            // user1 uploaded the post
            await publicSocialMedia.connect(user1).uploadPost(postHash);
            // let's check initial balance of user1's account
            const initBalanceUser1 = await ethers.provider.getBalance(
                user1.address
            );
            const tipAmount = ethers.utils.parseEther("1");
            // user2 is tipping 1 eth to user1's post
            expect(
                await publicSocialMedia
                    .connect(user2)
                    .tipPostOwner(1, { value: tipAmount })
            )
                .to.emit(publicSocialMedia, "PostTipped")
                .withArgs(1, postHash, tipAmount, user1.address);
            // //check if the amount tipped is updated for the post
            const _post = await publicSocialMedia.posts(1);
            expect(_post.tipAmount).to.equal(tipAmount);
            // let's check if the user1 has updated account balance or not
            const finalBalanceUser1 = await ethers.provider.getBalance(
                user1.address
            );
            expect(initBalanceUser1.add(tipAmount)).to.equal(finalBalanceUser1); // since it is bignumber so normal arithmetic operators will not work here we have to use ethers provided functions for arithmetic functions.
            // fail case:1
            // user2 is trying to give tip to post that does't exits
            expect(
                publicSocialMedia.connect(user2).tipPostOwner(2)
            ).to.revertedWith("ID is not valid");
            // fail case:2
            // user1 is trying to tip it's post
            expect(
                publicSocialMedia.connect(user1).tipPostOwner(1)
            ).to.revertedWith("You can not give tip to your post");
        });
    });
    describe("Getter functions", async () => {
        beforeEach(async () => {
            await publicSocialMedia.connect(user1).mint(URI);
            await publicSocialMedia.connect(user2).mint(URI);
            await publicSocialMedia.connect(user1).uploadPost(postHash);
            await publicSocialMedia.connect(user2).uploadPost(postHash);
            // user1 has two NFTs and 1 post
            // user2 has 1 NFT and 1 post
        });
        it("getAllPosts should give all the posts", async () => {
            const allPosts = await publicSocialMedia.getAllPosts();
            expect(allPosts.length).to.equal(2);
        });
        it("getMyNFTs should give all the NFTs", async () => {
            const user1NFTs = await publicSocialMedia
                .connect(user1)
                .getMyNFTs();
            const user2NFTs = await publicSocialMedia
                .connect(user2)
                .getMyNFTs();
            expect(user1NFTs.length).to.equal(2);
            expect(user2NFTs.length).to.equal(1);
        });
    });
});
