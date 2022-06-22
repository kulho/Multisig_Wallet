const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  let quorum = 2;

  let accounts = await ethers.getSigners();
  let approvers = [
    accounts[0].address,
    accounts[1].address,
    accounts[2].address,
  ];
  // We get the contract to deploy
  const Wallet = await hre.ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy(approvers, quorum);

  await wallet.deployed();

  console.log("Wallet deployed to:", wallet.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
