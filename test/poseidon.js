const { poseidonContract, buildPoseidon } = require("circomlibjs");
const { ethers } = require("hardhat");
const { wasm } = require("circom_tester");
const path = require("path");
const { expect } = require("chai");
describe("Compare Poseidon in solidity, circom and js", function () {
    it("Correct", async function () {
        const deployer = (await ethers.getSigners())[0];
        const code = poseidonContract.createCode(2);
        const abi = poseidonContract.generateABI(2);
        const contractFactory = new ethers.ContractFactory(abi, code, deployer);

        const poseidon3 = await contractFactory.deploy();
        await poseidon3.deployTransaction.wait();

        const res = await poseidon3["poseidon(uint256[2])"]([10, 11]);
        console.log(res);

        const circuit = await wasm(path.join("test", "circuits", "poseidon.circom"));
        const inputs = [10, 11];
        const witness = await circuit.calculateWitness({ inputs });
        const res2 = witness[1];
        console.log(res2);
        expect(res).to.equal(res2);

        const poseidon = await buildPoseidon();
        const res3 = poseidon.F.toString(poseidon([10, 11]));
        console.log(res3);
        expect(res).to.equal(res3);
    });

})