## What is Inflection?

**Inflection is a censorship-resistant, human-verified, fundraising platform for everyone.**
There are fundraisers that get deplatformed from GoFundMe, there are some that hit the legal limit of $5M through Reg CF, and some fundraisers are hosted by those who aren't the actual party that needs help.

## How did you use Humanity Protocol?
We used it to verify that those who are creating campaigns are real humans.

## Who is the team?
Nathan Liow - Solana VM master, trenchtown.fun, Sophomore CS @ UT Austin
Gautum Narayan - Incoming intern @ Base, Sophomore CS @ UT Austin
Shiva Balathandayuthapani - Junior CS + Math @ UT Austin
Savindu Wimalasooriya - Cofounder of ctrlsheet.ai, Senior CS @ UT Austin

## Humanity protocol integration instructions
Creating an account calls the Issue Credentials (VCs) api, and when someone goes to create a campaign we call Verify Credentials (VCs) api.

## Humanity protocol feedback
The palm and infrared vein scan is really innovative, I think a more robust suite of developer tools to do cooler things would be nice.

## Slide deck/video demo

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
