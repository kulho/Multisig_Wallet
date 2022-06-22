const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSig wallet test", function () {
  let wallet;
  let accounts;
  let approvers;
  let quorum = 2;
  let provider;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    approvers = [accounts[0].address, accounts[1].address, accounts[2].address];
    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy(approvers, quorum);
    provider = waffle.provider;

    await accounts[0].sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("10"),
    });
  });

  it("should have correct approvers and quorum", async function () {
    const _approvers = await wallet.getApprovers();
    const _quorum = await wallet.quorum();

    expect(_approvers).to.deep.equal(approvers);
    expect(_quorum).to.equal(quorum);
  });

  it("should create transfers", async () => {
    await wallet
      .connect(accounts[0])
      .createTransfer(
        ethers.utils.parseEther("1").toString(),
        accounts[5].address
      );
    const transfers = await wallet.getTransfers();
    expect(transfers.length).to.equal(1);
    expect(transfers[0].id).to.equal("0");
    expect(transfers[0].amount).to.equal(
      ethers.utils.parseEther("1").toString()
    );
    expect(transfers[0].recipient).to.equal(accounts[5].address);
    expect(transfers[0].approvals).to.equal("0");
    expect(transfers[0].sent).to.equal(false);
  });

  it("should not create transfers if sender is not approved", async () => {
    await expect(
      wallet
        .connect(accounts[4])
        .createTransfer(
          ethers.utils.parseEther("1").toString(),
          accounts[6].address
        )
    ).to.be.revertedWith("only approver allowed");
  });

  it("should increment approvals", async () => {
    await wallet
      .connect(accounts[0])
      .createTransfer(
        ethers.utils.parseEther("1").toString(),
        accounts[5].address
      );
    await wallet.connect(accounts[0]).approveTransfer(0);
    const transfers = await wallet.getTransfers();
    const balance = await provider.getBalance(wallet.address);
    expect(transfers[0].approvals).to.equal("1");
    expect(transfers[0].sent).to.equal(false);
    expect(balance).to.equal(ethers.utils.parseEther("10").toString());
  });

  it("should send transfer if quorum reached", async () => {
    const balanceBefore = await provider.getBalance(accounts[6].address);
    await wallet
      .connect(accounts[0])
      .createTransfer(
        ethers.utils.parseEther("1").toString(),
        accounts[6].address
      );
    await wallet.connect(accounts[0]).approveTransfer(0);
    await wallet.connect(accounts[1]).approveTransfer(0);
    const balanceAfter = await provider.getBalance(accounts[6].address);
    expect(balanceAfter.sub(balanceBefore)).to.equal(
      ethers.utils.parseEther("1").toString()
    );
  });

  it("should not approve transfer if sender is not approved", async () => {
    await wallet
      .connect(accounts[0])
      .createTransfer(
        ethers.utils.parseEther("1", "ether").toString(),
        accounts[5].address
      );
    await expect(
      wallet.connect(accounts[4]).approveTransfer(0)
    ).to.be.revertedWith("only approver allowed");
  });

  it("should not approve transfer if transfer is already sent", async () => {
    await wallet
      .connect(accounts[0])
      .createTransfer(
        ethers.utils.parseEther("1").toString(),
        accounts[6].address
      );
    await wallet.connect(accounts[0]).approveTransfer(0);
    await wallet.connect(accounts[1]).approveTransfer(0);

    await expect(
      wallet.connect(accounts[2]).approveTransfer(0)
    ).to.be.revertedWith("Transfer has already been sent");
  });

  it("should not approve transfer twice", async () => {
    await wallet
      .connect(accounts[0])
      .createTransfer(
        ethers.utils.parseEther("1").toString(),
        accounts[6].address
      );
    await wallet.connect(accounts[0]).approveTransfer(0);
    await expect(
      wallet.connect(accounts[0]).approveTransfer(0)
    ).to.be.revertedWith("Cannot approve transfer twice");
  });
});
