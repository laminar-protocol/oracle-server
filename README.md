# oracle-server

## Prerequisite

Install [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/).
- Ensure that you have a LTS Node.js installed, with version `12.x`.

## Build and run

To start an oracle server
1. Run `yarn` to install dependencies.
2. Use `yarn build` to build the project.
3. Use `yarn start`, with environment variables explained in the following section.

### Environment variables

[DOTENV](https://github.com/motdotla/dotenv#readme) is supported, and variables could be configured in a `.ENV` file.

#### Common

Common environment variables are needed no matter feeding for Ethereum smart contracts or Substrate based networks.

* `ALPHA_VANTAGE_API_KEY`: the api key of Alpha Vantage.
* `PRICE_FEED_INTERVAL_MS`: price feed intervals, by milliseconds.

By default, logs would be saved in `error.log` and `combined.log`. To enable logging in console, set environment variable `CONSOLE_LOG` as `true`.

#### Ethereum
For mainnet or Ethereum testnets like Kovan, contract addresses would be fetched from [`laminar-protocol/flow-protocol-ethereum`](https://github.com/laminar-protocol/flow-protocol-ethereum) package. The following environment variables would be needed:
* `WEB3_PROVIDER`: web3 provider.
* `ETH_PRIVATE_KEY`: feeder's private key.
* `CHAIN`: `mainnet`, `kovan` etc.
* `GAS_LIMIT`: gas limit.

For local testnet, additional environment variables would be needed:
* `LOCAL_TESTNET_ORACLE_CONTRACT_ADDR`: the oracle contract address in local testnet.
* `FJPY`: `fJPY` contract address.
* `FEUR`: `fEUR` contract address.

#### Substrate

* `SUB_KEY_SEED`: key seed.
* `SUB_ENDPOINT`: node endpoint, could be `http`/`https` or `ws`/`wss`.

For Laminar Chain, set `FEED_LAMINAR` as `true`; For Acala Network, set `FEED_ACALA` as `true`.

#### API Server

With `API_KEY` set, an API server would be spinned up for querying and modifying oracle server states.

The default port number would be `3000`, to use a different one, set the `PORT` env variable.
