import { React } from "react";
import { Web3 } from "web3/dist/web3.min.js";
import Wallet from "./contracts/Wallet.json";
import { useWeb3React } from "@web3-react/core";
import {
  InjectedConnector,
  UserRejectedRequestError,
} from "@web3-react/injected-connector";
import { useEffect } from "react";
import { Box, Button, Text } from "@chakra-ui/react";

const getWeb3 = () => {
  //   const { library } = useWeb3React();
  //   const web = new Web3(library.provider);
  //   return web3;
  return new Promise((resolve, reject) => {
    window.addEventListener("load", async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      } else if (window.web3) {
        resolve(window.web3);
      } else {
        reject("Must install Metamask");
      }
    });
  });
};

const getWallet = async (web3) => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = Wallet.networks[networkId];
  return new web3.eth.Contract(
    Wallet.abi,
    deployedNetwork && deployedNetwork.address
  );
};

function formatAddress(value, length) {
  return `${value.substring(0, length + 2)}...${value.substring(
    value.length - length
  )}`;
}

const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42],
});

const ConnectMetamask = () => {
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

  const onClickConnect = () => {
    activate(
      injected,
      (error) => {
        if (error instanceof UserRejectedRequestError) {
          console.log("user refused");
        } else {
          setError(error);
        }
      },
      false
    );
  };

  const onClickDisconnect = () => {
    deactivate();
  };

  useEffect(() => {
    console.log(chainId, account, active, library, connector);
  });

  return (
    <div>
      {active && typeof account === "string" ? (
        <Box>
          <Button type="button" w="100%" onClick={onClickDisconnect}>
            Account: {formatAddress(account, 4)}
          </Button>
          <Text fontSize="sm" w="100%" my="2" align="center">
            ChainID: {chainId} connected
          </Text>
        </Box>
      ) : (
        <Box>
          <Button type="button" w="100%" onClick={onClickConnect}>
            Connect MetaMask
          </Button>
          <Text fontSize="sm" w="100%" my="2" align="center">
            {" "}
            not connected{" "}
          </Text>
        </Box>
      )}
    </div>
  );
};

export { getWeb3, getWallet, ConnectMetamask };
