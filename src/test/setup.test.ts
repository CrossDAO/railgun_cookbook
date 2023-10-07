import {
  NetworkName,
  delay,
  TXIDVersion,
  isDefined,
} from '@railgun-community/shared-models';
import {
  createRailgunWallet2ForTests,
  createRailgunWalletForTests,
  loadLocalhostFallbackProviderForTests,
  mintAndShieldERC721,
  pollUntilUTXOMerkletreeScanned,
  removeTestDB,
  shieldAllTokensForTests,
  startRailgunForTests,
  waitForShieldedNFTBalance,
  waitForShieldedTokenBalances,
} from './railgun-setup.test';
import { ForkRPCType, setupTestRPCAndWallets } from './rpc-setup.test';
import { testConfig } from './test-config.test';
import { getForkTestNetworkName } from './common.test';
import { ethers } from 'ethers';
import {
  abi as AccessCardNFTABI,
  bytecode as AccessCardNFTBytecode,
} from '../bytecode/accessCardNFT.json';
import { getTestEthersWallet } from './shared.test';
import { AccessCardNFT } from 'typechain';

before(async function run() {
  if (isDefined(process.env.RUN_FORK_TESTS)) {
    this.timeout(3 * 60 * 1000); // 3 min timeout for setup.
    removeTestDB();
    await setupForkTests();
  }
});

after(() => {
  if (isDefined(process.env.RUN_FORK_TESTS)) {
    removeTestDB();
  }
});

const getTestERC20Addresses = (networkName: NetworkName): string[] => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return [
        testConfig.contractsEthereum.weth9,
        testConfig.contractsEthereum.rail,
        testConfig.contractsEthereum.usdc,
        testConfig.contractsEthereum.usdcWethSushiSwapV2LPToken,
        testConfig.contractsEthereum.crvUSDCWBTCWETH,
        testConfig.contractsEthereum.mooConvexTriCryptoUSDC,
      ];
    case NetworkName.Arbitrum:
      return [testConfig.contractsArbitrum.dai];
    case NetworkName.BNBChain:
    case NetworkName.Polygon:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli:
    case NetworkName.PolygonMumbai:
    case NetworkName.ArbitrumGoerli:
    case NetworkName.Hardhat:
    case NetworkName.Railgun:
      return [];
  }
};

const getSupportedNetworkNamesForTest = (): NetworkName[] => {
  return [NetworkName.Ethereum, NetworkName.Arbitrum];
};

export const setupForkTests = async () => {
  const networkName = getForkTestNetworkName();
  const txidVersion = TXIDVersion.V2_PoseidonMerkle;

  if (!Object.keys(NetworkName).includes(networkName)) {
    throw new Error(
      `Unrecognized network name, expected one of list: ${getSupportedNetworkNamesForTest().join(
        ', ',
      )}`,
    );
  }

  const tokenAddresses: string[] = getTestERC20Addresses(networkName);

  const forkRPCType = isDefined(process.env.USE_GANACHE)
    ? ForkRPCType.Ganache
    : isDefined(process.env.USE_HARDHAT)
    ? ForkRPCType.Hardhat
    : ForkRPCType.Anvil;

  // Ganache forked Ethereum RPC setup
  await setupTestRPCAndWallets(forkRPCType, networkName, tokenAddresses);

  // Quickstart setup
  startRailgunForTests();

  await loadLocalhostFallbackProviderForTests(networkName);

  await pollUntilUTXOMerkletreeScanned();

  // Set up primary wallet
  await createRailgunWalletForTests();

  // Set up secondary wallets
  await createRailgunWallet2ForTests();

  const ethersWallet = getTestEthersWallet();
  // ethersWallet.connect(getTestProvider());

  const AccessCardNFTFactory = new ethers.ContractFactory(
    AccessCardNFTABI,
    AccessCardNFTBytecode,
    ethersWallet,
  );
  const accessCardNFT = (await AccessCardNFTFactory.deploy()) as AccessCardNFT;

  await delay(1000);

  // console.log(`await accessCardNFT.getAddress());
  testConfig.contractsEthereum.accessCard = await accessCardNFT.getAddress();

  console.log(await ethersWallet.getAddress());
  console.log(testConfig.contractsEthereum.accessCard);

  const mintTransaction = await accessCardNFT.safeMint.populateTransaction(
    await ethersWallet.getAddress(),
    0n,
  );
  await ethersWallet.sendTransaction(mintTransaction);

  // Shield tokens for tests
  // await shieldAllTokensForTests(networkName, tokenAddresses);

  // Make sure shielded balances are updated
  // await waitForShieldedTokenBalances(txidVersion, networkName, tokenAddresses);

  // TODO: Deploy NFT contract
  // ...

  // TODO: Add nftAddress / tokenSubID
  await mintAndShieldERC721(
    networkName,
    testConfig.contractsEthereum.accessCard,
    '0x00',
  );

  await waitForShieldedNFTBalance(
    txidVersion,
    networkName,
    testConfig.contractsEthereum.accessCard,
    '0x00',
  );
};
