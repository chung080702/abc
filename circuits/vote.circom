pragma circom 2.0.0;

include "merkleTree.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template Vote(levels) {
    signal input id;
    signal input root;
    signal input nullifier;
    signal input points;
    signal input secret;
    signal input power;
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component checkLeaf = Poseidon(2);
    checkLeaf.inputs[0] <== secret;
    checkLeaf.inputs[1] <== power;
    checkLeaf.out === leaf;

    component checkNullifier = Poseidon(2);
    checkNullifier.inputs[0] <== secret;
    checkNullifier.inputs[1] <== id;
    checkNullifier.out === nullifier;

    component checkPoints = LessEqThan(250);
    checkPoints.in[0] <== points;
    checkPoints.in[1] <== power;
    checkPoints.out === 1;
 
    component checkPath = MerkleTreeChecker(levels);
    checkPath.leaf <== leaf;
    checkPath.root <== root;
    for (var i = 0; i < levels; i++) {
        checkPath.pathElements[i] <== pathElements[i];
        checkPath.pathIndices[i] <== pathIndices[i];
    }
}

//component main {public [contractRoot,electionRoot,votingPoint,electionId]} = Vote(5);