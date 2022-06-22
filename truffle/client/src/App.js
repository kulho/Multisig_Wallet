import { useEffect, useState } from "react";
import { getWeb3, getWallet } from "./utils";
import Header from "./Header";
import NewTransfer from "./NewTransfer";
import TransferList from "./TransferList";
import { useWeb3React } from "@web3-react/core";
import { Web3 } from "web3/dist/web3.min.js";

function App() {
  const {
    chainId,
    account,
    activate,
    deactivate,
    setError,
    active,
    library,
    connector,
  } = useWeb3React();
  const web3 = new Web3(library.provider);

  //   const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [wallet, setWallet] = useState(undefined);
  const [approvers, setApprovers] = useState([]);
  const [quorum, setQuorum] = useState(undefined);
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    const init = async () => {
      //   const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const wallet = await getWallet(web3);
      const approvers = await wallet.methods.getApprovers().call();
      const quorum = await wallet.methods.quorum().call();
      const transfers = await wallet.methods.getTransfers().call();
      //   setWeb3(web3);
      setAccounts(accounts);
      setWallet(wallet);
      setApprovers(approvers);
      setQuorum(quorum);
      setTransfers(transfers);
    };
    init();
  }, []);

  const createTransfer = async (transfer) => {
    const gas = await wallet.methods
      .createTransfer(transfer.amount, transfer.to)
      .estimateGas({
        from: accounts[0],
      });
    wallet.methods
      .createTransfer(transfer.amount, transfer.to)
      .send({ from: accounts[0], gas: gas + 10000 });
  };

  const approveTransfer = async (transferId) => {
    const gas = await wallet.methods
      .approveTransfer(transferId)
      .estimateGas({ from: accounts[0] });
    wallet.methods
      .approveTransfer(transferId)
      .send({ from: accounts[0], gas: gas + 10000 });
  };

  if (
    typeof web3 === "undefined" ||
    typeof accounts === "undefined" ||
    typeof wallet === "undefined" ||
    approvers.length === 0 ||
    typeof quorum === "undefined"
  ) {
    return <div> Loading ...</div>;
  }

  return (
    <div className="App">
      Multisig dapp
      <Header approvers={approvers} quorum={quorum} />
      <NewTransfer createTransfer={createTransfer} />
      <TransferList transfers={transfers} approveTransfer={approveTransfer} />
    </div>
  );
}

export default App;
