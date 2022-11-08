const { poseidonContract, buildPoseidon } = require("circomlibjs");
const { ethers } = require("hardhat");
const { wasm } = require("circom_tester");
const path = require("path");
const { expect } = require("chai");
const MerkleTree = require("../src/merkleTree.js");
describe("Compare Merkle Tree circom", function () {
    it("Testing", async function () {

        const tree = new MerkleTree(5);
        await tree.init();
        var x = Math.floor(Math.random() * 100000);
        var y = Math.floor(Math.random() * 100000);
        // for (var i = 0; i < 5; i++) console.log(tree.zeros[i])
        // console.log("---")
        console.log(tree.root);
        tree.insert(x);
        tree.insert(y);
        console.log(tree.root);
        const MTP = tree.getPath(2);
        const pathElements = MTP.pathElements;
        const pathIndices = MTP.pathIndices;

        const circuit = await wasm(path.join("test", "circuits", "merkleTree.circom"));
        //console.log(circuit)
        const inputs = { leaf: y, root: await tree.root, pathElements, pathIndices };
        const witness = await circuit.calculateWitness(inputs);
        await circuit.checkConstraints(witness);

    });

})