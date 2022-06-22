const Wallet = artifacts.require("Wallet");

module.exports = function (deployer, _, accounts) {
  let approvers = [
    String(accounts[0]),
    String(accounts[1]),
    String(accounts[2]),
  ];
  let quorum = 2;
  deployer.deploy(Wallet, approvers, quorum);
};
