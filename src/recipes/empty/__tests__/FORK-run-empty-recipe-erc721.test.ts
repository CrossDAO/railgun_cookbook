import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { RecipeInput } from '../../../models/export-models';
import {
  NETWORK_CONFIG,
  NFTTokenType,
  NetworkName,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { setRailgunFees } from '../../../init';
import {
  MOCK_RAILGUN_WALLET_ADDRESS,
  MOCK_SHIELD_FEE_BASIS_POINTS,
  MOCK_UNSHIELD_FEE_BASIS_POINTS,
} from '../../../test/mocks.test';
import { EmptyRecipe } from '../empty-recipe';
import {
  executeRecipeStepsAndAssertUnshieldBalances,
  shouldSkipForkTest,
} from '../../../test/common.test';
import { testConfig } from '../../../test/test-config.test';
import {
  TokenType,
  balanceForNFT,
  getTokenDataNFT,
} from '@railgun-community/wallet';
import { testRailgunWallet } from '../../../test/shared.test';

chai.use(chaiAsPromised);

const networkName = NetworkName.Ethereum;
const txidVersion = TXIDVersion.V2_PoseidonMerkle;
const tokenSubID = '0x0000';

describe.only('FORK-run-empty-recipe-erc721', function run() {
  this.timeout(45000);

  before(async function run() {
    setRailgunFees(
      networkName,
      MOCK_SHIELD_FEE_BASIS_POINTS,
      MOCK_UNSHIELD_FEE_BASIS_POINTS,
    );
  });

  it('[FORK] Should run empty-recipe with ERC721 inputs', async function run() {
    if (shouldSkipForkTest(networkName)) {
      this.skip();
      return;
    }

    const recipe = new EmptyRecipe();

    const recipeInput: RecipeInput = {
      railgunAddress: MOCK_RAILGUN_WALLET_ADDRESS,
      networkName,
      erc20Amounts: [],
      nfts: [
        {
          nftAddress: testConfig.contractsEthereum.accessCard,
          tokenSubID,
          amount: 1n,
          nftTokenType: NFTTokenType.ERC721,
        },
      ],
    };

    console.log(recipeInput);

    const recipeOutput = await recipe.getRecipeOutput(recipeInput);
    await executeRecipeStepsAndAssertUnshieldBalances(
      recipe.config.name,
      recipeInput,
      recipeOutput,
    );

    // REQUIRED TESTS:

    const nftTokenData = getTokenDataNFT(
      testConfig.contractsEthereum.accessCard,
      TokenType.ERC721,
      tokenSubID,
    );
    expect(
      balanceForNFT(txidVersion, testRailgunWallet, networkName, nftTokenData),
    ).to.equal(1n);

    // 2. Add External Balance expectations.
    // N/A
  });
});
