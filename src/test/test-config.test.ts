const PORT = 8545;

export const testConfig = {
  // Set env ETHEREUM_RPC to change default fork RPC.
  ethereumForkRPC: process.env.ETHEREUM_RPC || 'https://cloudflare-eth.com',

  port: PORT,

  localhostRPC: `http://localhost:${PORT}`,

  showVerboseLogs: false,

  // Mock wallets for tests
  signerMnemonic: 'test test test test test test test test test test test junk',
  railgunMnemonic:
    'test test test test test test test test test test test junk',
  encryptionKey:
    '0101010101010101010101010101010101010101010101010101010101010101',

  // RAILGUN deployment on Ethereum
  contractsEthereum: {
    proxy: '0xfa7093cdd9ee6932b4eb2c9e1cde7ce00b1fa4b9',
    treasuryProxy: '0xE8A8B458BcD1Ececc6b6b58F80929b29cCecFF40',
    weth9: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    relayAdapt: '0x0355B7B8cb128fA5692729Ab3AAa199C1753f726',

    // Tokens
    rail: '0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D',
    usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    // dai: '0x6b175474e89094c44da98b954eedeac495271d0f',

    // Vault tokens
    crvCRVETH: '0xEd4064f376cB8d68F770FB1Ff088a3d0F3FF5c4d',
    crvCRVETHVaultToken: '0x245186CaA063b13d0025891c0d513aCf552fB38E',
  },
};

try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, @typescript-eslint/no-var-requires
  const overrides = require('./test-config-overrides.test');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  Object.assign(testConfig, overrides ?? {});
  // eslint-disable-next-line no-empty
} catch {}
