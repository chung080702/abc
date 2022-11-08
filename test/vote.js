const { wasm } = require("circom_tester");
const path = require("path");
const { expect } = require("chai");
const MerkleTree = require("../src/merkleTree.js");
const { verify } = require("crypto");
describe("Test vote circom", function () {
    it("Testing", async function () {

        const tree = new MerkleTree(5);
        await tree.init();
        secret = 12345;
        power = 456;

        tree.insert(tree.hashLeftRight(secret, power));
        tree.insert(1000022);
        tree.insert(10033);
        const input = tree.vote(100, secret, power, 1, 20);
        // signal input id;
        // signal input root;
        // signal input nullifier;
        // signal input points;
        // signal input secret;
        // signal input power;
        // signal input leaf;
        // signal input pathElements[levels];
        // signal input pathIndices[levels];

        const circuit = await wasm(path.join("test", "circuits", "vote.circom"));
        //console.log(circuit)
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);

    });

})