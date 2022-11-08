const { ethers } = require("hardhat");

const main = async () => {
    const deployer = await ethers.getSigner();
    const daoFactory = await ethers.getContractFactory("DAO");
    const updateFactory = await ethers.getContractFactory("contracts/update.sol:Verifier");
    const voteFactory = await ethers.getContractFactory("contracts/vote.sol:Verifier");
    const updateContract = await updateFactory.deploy();
    const voteContract = await voteFactory.deploy();
    daoContract = await daoFactory.deploy(updateContract.address, voteContract.address);
    console.log(daoContract.address);
}




main()