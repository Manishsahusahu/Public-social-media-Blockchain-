const fs = require("fs");
const { ethers } = require("hardhat");
async function main() {
  const [deployer, user1] = await ethers.getSigners();
  // We get the contract factory to deploy
  const PublicSocialMediaFactory = await ethers.getContractFactory(
    "PublicSocialMedia"
  );
  // Deploy contract
  const publicSocialMedia = await PublicSocialMediaFactory.deploy();
  // Save contract address file in project
  const contractsDir = __dirname + "/../src/contractsData";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/publicSocialMedia-address.json`,
    JSON.stringify({ address: publicSocialMedia.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync("PublicSocialMedia");

  fs.writeFileSync(
    contractsDir + `/publicSocialMedia.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
  console.log("PublicSocialMedia deployed to:", publicSocialMedia.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
