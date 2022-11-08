pragma circom 2.0.0;

include "../../circuits/update.circom";

component main {public [oldRoot,newRoot,index,power,newLeaf]} = Update(5);