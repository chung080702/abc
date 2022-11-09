import { buildPoseidon } from "circomlibjs";

class MerkleTree {
    constructor(levels) {
        this.levels = levels;
        this.nextIndex = 1;
    }

    hashLeftRight = (l, r) => {
        return this.poseidon.F.toString(this.poseidon([l, r]));
    }

    calculateZeros = () => {
        this.zeros = [];
        this.zeros[0] = this.hashLeftRight(0, 0);
        for (var i = 1; i <= this.levels; i++) {
            this.zeros.push(this.hashLeftRight(this.zeros[i - 1], this.zeros[i - 1]))
        }
    }

    init = async () => {
        this.poseidon = await buildPoseidon();
        this.calculateZeros();
        this.root = this.zeros[this.levels];
        this.nodes = [];
        for (var i = 0; i < this.levels; i++) {
            this.nodes[i] = [];
            for (var j = 0; j < (1 << (this.levels - i)); j++) this.nodes[i][j] = this.zeros[i];
        }
    }

    _update = (_leaf, index) => {
        var currentIndex = index;
        var currentLevelHash = _leaf.toString();
        var left;
        var right;

        for (var i = 0; i < this.levels; i++) {
            //console.log(currentLevelHash);
            this.nodes[i][currentIndex] = currentLevelHash;

            if (currentIndex % 2 === 0) {
                left = currentLevelHash;
                right = this.nodes[i][currentIndex ^ 1];
            } else {
                left = this.nodes[i][currentIndex ^ 1];
                right = currentLevelHash;
            }
            currentLevelHash = this.hashLeftRight(left, right);
            //console.log(currentLevelHash)
            currentIndex /= 2;
            currentIndex = Math.floor(currentIndex)

        }

        this.root = currentLevelHash;
        //console.log(this.root)
    }
    insert = (_leaf) => {
        this._update(_leaf, this.nextIndex);
        this.nextIndex++;
        return this.nextIndex;
    }

    update = (secret, power, index) => {
        index = Number(index);
        //console.log(secret, power, index)
        const input = {};
        input.oldRoot = this.root;
        input.oldLeaf = this.nodes[0][index];
        input.index = index;
        input.secret = secret;
        input.power = power.toString();
        input.pathElements = this.getPath(index).pathElements;
        input.pathIndices = this.getPath(index).pathIndices;
        input.newLeaf = this.hashLeftRight(secret, power);
        this._update(input.newLeaf, index);
        input.newRoot = this.root;
        return input;
    }

    vote = (id, secret, power, index, points) => {
        const input = {};
        input.id = id;
        input.secret = secret;
        input.power = power;
        input.leaf = this.hashLeftRight(secret, power);
        input.root = this.root;
        input.pathElements = this.getPath(index).pathElements;
        input.pathIndices = this.getPath(index).pathIndices;
        input.root = this.root;
        input.nullifier = this.hashLeftRight(input.secret, input.id);
        input.points = points;
        return input;
    }
    getPath = (index) => {
        var pathElements = [];
        var pathIndices = [];
        for (var i = 0; i < this.levels; i++) {
            pathElements[i] = this.nodes[i][index ^ 1];
            pathIndices[i] = index % 2;
            index /= 2;
            index = Math.floor(index)

        }
        return { pathElements, pathIndices }
    }

}

export default MerkleTree;