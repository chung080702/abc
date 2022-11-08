const { ethers } = require("hardhat");
const path = require("path");
const { expect } = require("chai");
const MerkleTree = require("../src/merkleTree.js");
const snarkjs = require("snarkjs");
const { wasm } = require("circom_tester");
const genCallData = async (proof, publicSignals) => {
    var callData = (
        await snarkjs.groth16.exportSolidityCallData(proof, publicSignals)
    )
        .toString()
        .split(",")
        .map((e) => {
            return e.replaceAll(/([\[\]\s\"])/g, "");
        });
    let a,
        b = [],
        c,
        public;
    a = callData.slice(0, 2).map((e) => BigInt(e));
    b[0] = callData.slice(2, 4).map((e) => BigInt(e));
    b[1] = callData.slice(4, 6).map((e) => BigInt(e));
    c = callData.slice(6, 8).map((e) => BigInt(e));
    public = callData.slice(8, callData.length).map((e) => BigInt(e));
    return { a, b, c, public };
}
describe("Test dao", function () {
    var user = [];
    var daoContract;
    var tree = new MerkleTree(5);
    before("init contract", async () => {
        user = await ethers.getSigners();
        const daoFactory = await ethers.getContractFactory("DAO");
        const updateFactory = await ethers.getContractFactory("contracts/update.sol:Verifier");
        const voteFactory = await ethers.getContractFactory("contracts/vote.sol:Verifier");
        const updateContract = await updateFactory.deploy();
        const voteContract = await voteFactory.deploy();
        daoContract = await daoFactory.deploy(updateContract.address, voteContract.address);
        await tree.init();
    })
    it("Test add power", async function () {
        const eth = 1000;
        //console.log(tree.root);
        const input = tree.update(12345, await daoContract.power(user[0].address) + eth, 1);
        //console.log(Number(await daoContract.power(user[0].address)));
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            path.resolve("./update_js/update.wasm"),
            path.resolve("./update_final.zkey")
        );
        const { a, b, c, public } = await genCallData(proof, publicSignals);
        await daoContract.addPower(a, b, c, public[1], public[4], { value: eth });
        console.log(await daoContract.power(user[0].address));
    });
    it("Test vote", async () => {
        await daoContract.genElection(4);
        const input = tree.vote(1, 12345, Number(await daoContract.power(user[0].address)), 1, 990);
        //console.log(input);
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            path.resolve("./vote_js/vote.wasm"),
            path.resolve("./vote_final.zkey")
        );
        const { a, b, c, public } = await genCallData(proof, publicSignals);
        await daoContract.connect(user[1]).vote(a, b, c, 1, 990, 222, public[2]);
        console.log(await daoContract.electionPoints(1, 222));
        //await daoContract.vote(a, b, c, 1, 990, 222, public[2]);
    })
})