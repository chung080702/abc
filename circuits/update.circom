pragma circom 2.0.0;

include "merkleTree.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template Update(levels) {
    signal input oldRoot;
    signal input newRoot;
    signal input index;
    signal input secret;
    signal input power;
    signal input oldLeaf;
    signal input newLeaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    component checkNewLeaf = Poseidon(2);
    checkNewLeaf.inputs[0] <== secret;
    checkNewLeaf.inputs[1] <== power;
    checkNewLeaf.out === newLeaf;

    /// check path Indices
    signal bit[levels];
    for (var i = 0; i < levels;i++) {
        bit[i] <-- (index >> i) & 1;
        bit[i] * (bit[i] -1 ) === 0;
        bit[i] === pathIndices[i];
    }

    component checkOldPath = MerkleTreeChecker(levels);
    checkOldPath.leaf <== oldLeaf;
    checkOldPath.root <== oldRoot;
    for (var i = 0; i < levels; i++) {
        checkOldPath.pathElements[i] <== pathElements[i];
        checkOldPath.pathIndices[i] <== pathIndices[i];
    }

    component checkNewPath = MerkleTreeChecker(levels);
    checkNewPath.leaf <== newLeaf;
    checkNewPath.root <== newRoot;
    for (var i = 0; i < levels; i++) {
        checkNewPath.pathElements[i] <== pathElements[i];
        checkNewPath.pathIndices[i] <== pathIndices[i];
    }
}

//component main {public [contractRoot,electionRoot,votingPoint,electionId]} = Vote(5);