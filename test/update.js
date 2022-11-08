const { wasm } = require("circom_tester");
const path = require("path");
const { expect } = require("chai");
const MerkleTree = require("../src/merkleTree.js");
const { verify } = require("crypto");
describe("Test update circom", function () {
    it("Testing", async function () {

        const tree = new MerkleTree(5);
        await tree.init();
        tree.insert(1000022);
        tree.insert(192);
        const input = tree.update(12345, 6789, 2)
        const circuit = await wasm(path.join("test", "circuits", "update.circom"));
        //console.log(circuit)
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);

    });

})