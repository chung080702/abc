pragma circom 2.0.0;

include "../../circuits/vote.circom";

component main {public [id,root,nullifier,points]} = Vote(5);