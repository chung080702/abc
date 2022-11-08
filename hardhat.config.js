require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    defaultNetwork: "hardhat",
    solidity: {
        compilers: [{ version: "0.6.11" }, { version: "0.8.0" }],
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
        player: {
            default: 1,
        },
        voter: {
            default: 2,
        },
    },
};