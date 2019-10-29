# oracle-server

## Run

To start an oracle server, use `yarn start`, with environment variables explained in the following part.

### Environment variables

For mainnet or Ethereum testnets like Kovan, contract addresses would be fetched from [`laminar-protocol/flow-protocol-ethereum`](https://github.com/laminar-protocol/flow-protocol-ethereum) package. The following environment variables would be needed:
* `ALPHA_VANTAGE_API_KEY`: the api key of Alpha Vantage.
* `WEB3_PROVIDER`: web3 provider.
* `ETH_PRIVATE_KEY`: feeder's private key.
* `CHAIN`: `mainnet`, `kovan` etc.
* `GAS_LIMIT`: gas limit.
* `PRICE_FEED_INTERVAL_MS`: price feed intervals, by milliseconds.

For local testnet, additional environment variables would be needed:
* `LOCAL_TESTNET_ORACLE_CONTRACT_ADDR`: the oracle contract address in local testnet.
* `FJPY`: `fJPY` contract address.
* `FEUR`: `fEUR` contract address.

By default, logs would be saved in `error.log` and `combined.log`. To enable logging in console, set environment variable `CONSOLE_LOG` as `true`.
