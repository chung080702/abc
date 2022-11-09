import React from "react";
import { ethers } from 'ethers';
import dao from './DAO.json';
import MerkleTree from "./merkleTree.js";
import path from "path";

const DAO_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const snarkjs = window.snarkjs;

const BigInt = (e) => {
    return ethers.BigNumber.from(e);
}
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
        publicInputs;
    a = callData.slice(0, 2).map((e) => BigInt(e));
    b[0] = callData.slice(2, 4).map((e) => BigInt(e));
    b[1] = callData.slice(4, 6).map((e) => BigInt(e));
    c = callData.slice(6, 8).map((e) => BigInt(e));
    publicInputs = callData.slice(8, callData.length).map((e) => BigInt(e));
    return { a, b, c, publicInputs };
}

export class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { power: "", index: "", table: [] }
    }


    async fetchData() {
        if (typeof window.ethereum !== "undefined") {
            //ethereum is usable get reference to the contract
            await this.requestAccount();
            const provider = new ethers.providers.Web3Provider(window.ethereum);

            //signer needed for transaction that changes state
            const signer = provider.getSigner();
            console.log(signer);
            const contract = new ethers.Contract(DAO_ADDRESS, dao.abi, signer);

            //try to get the greeting in the contract

            const power = await contract.power(await signer.getAddress());
            const index = await contract.index(await signer.getAddress());

            if (index == 0) {
                document.getElementById("create_leaf").removeAttribute("hidden");
            }
            const electionsNumber = await contract.electionID();

            console.log(electionsNumber);
            var table = [];
            for (var i = 0; i < electionsNumber; i++) {
                table[i] = [];
                table[i][0] = i + 1;
                for (var j = 1; j < 3; j++) {
                    table[i][j] = Number(await contract.electionPoints(i + 1, j));
                }
            }
            console.log(table);
            this.setState({ power: Number(power), index: Number(index), table: table });
            console.log(this.state);
        }
    }


    async addPower(additionPower, secret) {
        console.log(additionPower, secret)
        if (additionPower && secret && typeof window.ethereum !== "undefined") {
            //ethereum is usable, get reference to the contract
            await this.requestAccount();
            const provider = new ethers.providers.Web3Provider(window.ethereum);


            //signer needed for transaction that changes state

            const signer = provider.getSigner();
            const contract = new ethers.Contract(DAO_ADDRESS, dao.abi, signer);
            console.log(await signer.getAddress());
            //preform transaction
            const filter = await contract.filters.Update(null, null, null);
            var data = await contract.queryFilter(filter, 1, await provider.getBlockNumber());
            const array = data.map((x) => {
                return { index: x.args["index"], leaf: x.args["leaf"] }
            })

            console.log(data);
            const tree = new MerkleTree(5);
            await tree.init();
            array.forEach((x) => {
                tree._update(x.leaf, x.index);
            })

            console.log(BigInt(tree.root));
            console.log(await contract.currentRoot());
            var index = await contract.index(await signer.getAddress());
            if (index == 0) index = await contract.currentIndex() + 1;
            var power = await contract.power(await signer.getAddress());
            //console.log(secret, Numpower, Number(index));
            console.log(index);
            console.log(BigInt(power).add(BigInt(additionPower)))
            const input = tree.update(secret, BigInt(power).add(BigInt(additionPower)), index);
            console.log(input);
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                "app/update.wasm",
                "app/update_final.zkey"
                // path.resolve("./update_js/update.wasm"),
                // path.resolve("./update_final.zkey")
            );
            console.log(20);
            const { a, b, c, publicInputs } = await genCallData(proof, publicSignals);
            console.log(a, b, c);
            const transaction = await contract.addPower(a, b, c, publicInputs[1], publicInputs[4], { value: additionPower, gasLimit: 1e7, from: await signer.getAddress() });
            await transaction.wait();
            //console.log(a, b, c);
            //document.getElementById("create_leaf").setAttribute("hidden", " hidden");
            this.fetchData();
        }
    }
    async genElection(optionsNumber) {
        await this.requestAccount();
        const provider = new ethers.providers.Web3Provider(window.ethereum);


        //signer needed for transaction that changes state

        const signer = provider.getSigner();
        const contract = new ethers.Contract(DAO_ADDRESS, dao.abi, signer);

        const transaction = await contract.genElection(optionsNumber);
        await transaction.wait();
    }

    async vote(secret, power, id, points, option) {
        await this.requestAccount();
        const provider = new ethers.providers.Web3Provider(window.ethereum);


        //signer needed for transaction that changes state

        const signer = provider.getSigner();
        const contract = new ethers.Contract(DAO_ADDRESS, dao.abi, signer);
        var filter = await contract.filters.Update(null, null, null);
        var data = await contract.queryFilter(filter, 1, await provider.getBlockNumber());

        const array = data.map((x) => {
            return { index: x.args["index"], leaf: x.args["leaf"] }
        })

        const tree = new MerkleTree(5);
        await tree.init();
        var root = await contract.electionRoots(id);
        var index = -1;
        //console.log(array)
        for (var x of array) {
            //console.log(x);
            tree._update(x.leaf, x.index);
            if (tree.hashLeftRight(secret, power) == x.leaf) index = x.index;
            if (tree.root == root) break;
        }
        var input = tree.vote(id, secret, power, index, points);
        //console.log(input);
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            // path.resolve("./vote_js/vote.wasm"),
            // path.resolve("./vote_final.zkey")
            "app/vote.wasm",
            "app/vote_final.zkey"
        );
        const { a, b, c, publicInputs } = await genCallData(proof, publicSignals);
        const transaction = await contract.vote(a, b, c, id, points, option, publicInputs[2]);
        await transaction.wait();
        this.fetchData();
    }
    async requestAccount() {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    render() {
        return (

            <div class="center">

                <button id="btn_connect_metamask" onClick={() => {
                    this.fetchData();
                }}>Fetch data</button>

                <p>Power: {this.state.power}</p>
                <p>Index: {this.state.index}</p>

                <div id="create_leaf" >
                    <br />
                    <input id={"secret-x"} placeholder={"Secret"} />
                    <br />
                    <br />
                    <input id={"addition-power"} placeholder={"Addition power"} />
                    <br />
                    <br />
                    <button onClick={async () => {
                        const addtionPower = document.getElementById("addition-power").value;
                        const secret = document.getElementById("secret-x").value;
                        await this.addPower(addtionPower, secret);
                    }}>Create Power</button>
                </div>
                <br />
                <br />
                <div id="genElection" >
                    <br />
                    <input id={"options-number"} placeholder={"options number"} />
                    <br />
                    <br />
                    <button onClick={async () => {
                        const optionsNumber = document.getElementById("options-number").value;
                        await this.genElection(optionsNumber);
                    }}>Generate Election</button>
                </div>
                <br />
                <br />
                <br />
                <input id={"secret"} placeholder={"Secret"} />
                <br /><br />
                <input id={"power"} placeholder={"Power"} />
                <br /><br />
                <input id={"electionID"} placeholder={"ElectionID"} />
                <br /><br />
                <input id={"points"} placeholder={"Points"} />
                <br /><br />
                <input id={"option"} placeholder={"Option"} />
                <br /><br />
                <button onClick={async () => {
                    const secret = document.getElementById("secret").value;
                    const power = document.getElementById("power").value;
                    const electionID = document.getElementById("electionID").value;
                    const points = document.getElementById("points").value;
                    const option = document.getElementById("option").value;
                    await this.vote(secret, power, electionID, points, option);
                }}>Vote</button>


                <div class="table_responsive">
                    <table id="table">
                        <thead>
                            <tr>
                                <th>Election ID</th>
                                <th>Power True</th>
                                <th>Power False</th>
                            </tr>
                        </thead>

                        <tbody id="body">
                            {
                                this.state.table.map((x) => (
                                    <tr>
                                        <td>{x[0]}</td>
                                        <td>{x[1]}</td>
                                        <td>{x[2]}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

            </div >


        )
    }
}

export default App;