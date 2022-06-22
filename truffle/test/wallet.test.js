const Wallet = artifacts.require("Wallet");
const { expectRevert, balance } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Wallet", function (accounts) {
  let wallet;
  let approvers = [
    String(accounts[0]),
    String(accounts[1]),
    String(accounts[2]),
  ];
  let quorum = 2;

  beforeEach(async () => {
    wallet = await Wallet.new(approvers, quorum);
    web3.eth.sendTransaction({
      from: accounts[0],
      to: wallet.address,
      value: web3.utils.toWei("10", "ether"),
    });
  });

  it("should have correct approvers and quorum", async function () {
    const _approvers = await wallet.getApprovers();
    const _quorum = await wallet.quorum();
    assert.deepEqual(_approvers, approvers);
    assert.equal(_quorum.toNumber(), quorum);
  });

  it("should create transfers", async () => {
    await wallet.createTransfer(web3.utils.toWei("1", "ether"), accounts[5], {
      from: accounts[0],
    });
    const transfers = await wallet.getTransfers();
    assert(transfers.length === 1);
    assert(transfers[0].id === "0");
    assert(transfers[0].amount === web3.utils.toWei("1", "ether"));
    assert(transfers[0].recipient === String(accounts[5]));
    assert(transfers[0].approvals === "0");
    assert(transfers[0].sent === false);
  });

  it("should not create transfers if sender is not approved", async () => {
    await expectRevert(
      wallet.createTransfer(web3.utils.toWei("1", "ether"), accounts[5], {
        from: accounts[4],
      }),
      "only approver allowed"
    );
  });

  it("should increment approvals", async () => {
    await wallet.createTransfer(web3.utils.toWei("1", "ether"), accounts[5], {
      from: accounts[0],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    const transfers = await wallet.getTransfers();
    const balance = await web3.eth.getBalance(wallet.address);
    assert(transfers[0].approvals === "1");
    assert(transfers[0].sent === false);
    assert(balance === web3.utils.toWei("10", "ether"));
  });

  it("should send transfer if quorum reached", async () => {
    const balanceBefore = web3.utils.toBN(
      await web3.eth.getBalance(accounts[6])
    );
    await wallet.createTransfer(web3.utils.toWei("1", "ether"), accounts[6], {
      from: accounts[0],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[1] });
    const balanceAfter = web3.utils.toBN(
      await web3.eth.getBalance(accounts[6])
    );
    assert(
      String(balanceAfter.sub(balanceBefore)) === web3.utils.toWei("1", "ether")
    );
  });

  it("should not approve transfer if sender is not approved", async () => {
    await wallet.createTransfer(web3.utils.toWei("1", "ether"), accounts[5], {
      from: accounts[0],
    });
    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[4] }),
      "only approver allowed"
    );
  });

  it("should not approve transfer if transfer is already sent", async () => {
    await wallet.createTransfer(web3.utils.toWei("1", "ether"), accounts[6], {
      from: accounts[0],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[1] });

    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[2] }),
      "Transfer has already been sent"
    );
  });

  it("should not approve transfer twice", async () => {
    await wallet.createTransfer(web3.utils.toWei("1", "ether"), accounts[6], {
      from: accounts[0],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[0] }),
      "Cannot approve transfer twice"
    );
  });
});
