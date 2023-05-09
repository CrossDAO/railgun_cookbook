import {
  RecipeAddLiquidityData,
  RecipeERC20Info,
  StepInput,
  UniswapV2Fork,
} from '../../../models/export-models';
import { UniV2LikeSDK } from '../../../api/uniswap/uni-v2-like-sdk';
import { NetworkName } from '@railgun-community/shared-models';
import { RecipeERC20Amount } from '../../../models';
import { ApproveERC20SpenderStep } from '../../../steps/token/erc20/approve-erc20-spender-step';
import { UniV2LikeAddLiquidityStep } from '../../../steps/liquidity/uni-v2-like/uni-v2-like-add-liquidity-step';
import { BaseProvider } from '@ethersproject/providers';
import { Step } from '../../../steps/step';
import { AddLiquidityRecipe } from '../add-liquidity-recipe';
import { findFirstInputERC20Amount } from '../../../utils/filters';

export class UniV2LikeAddLiquidityRecipe extends AddLiquidityRecipe {
  readonly config = {
    name: '[Name] Add Liquidity',
    description: 'Adds liquidity to a [Name] Pool.',
    hasNonDeterministicOutput: true,
  };

  private readonly uniswapV2Fork: UniswapV2Fork;

  private readonly erc20InfoA: RecipeERC20Info;
  private readonly erc20InfoB: RecipeERC20Info;

  private readonly slippagePercentage: number;
  private readonly provider: BaseProvider;

  constructor(
    uniswapV2Fork: UniswapV2Fork,
    erc20InfoA: RecipeERC20Info,
    erc20InfoB: RecipeERC20Info,
    slippagePercentage: number,
    provider: BaseProvider,
  ) {
    super();
    this.uniswapV2Fork = uniswapV2Fork;

    this.erc20InfoA = erc20InfoA;
    this.erc20InfoB = erc20InfoB;
    this.slippagePercentage = slippagePercentage;
    this.provider = provider;

    const forkName = UniV2LikeSDK.getForkName(uniswapV2Fork);
    this.config.name = `${forkName} Add Liquidity`;
    this.config.description = `Adds liquidity to a ${forkName} Pool.`;
  }

  protected supportsNetwork(networkName: NetworkName): boolean {
    return UniV2LikeSDK.supportsForkAndNetwork(this.uniswapV2Fork, networkName);
  }

  protected async getAddLiquidityData(
    networkName: NetworkName,
    erc20AmountA: RecipeERC20Amount,
  ): Promise<RecipeAddLiquidityData> {
    this.addLiquidityData = await UniV2LikeSDK.getAddLiquidityData(
      this.uniswapV2Fork,
      networkName,
      erc20AmountA,
      this.erc20InfoB,
      this.slippagePercentage,
      this.provider,
    );
    return this.addLiquidityData;
  }

  protected async getInternalSteps(
    firstInternalStepInput: StepInput,
  ): Promise<Step[]> {
    const { networkName, erc20Amounts } = firstInternalStepInput;

    const erc20AmountA = findFirstInputERC20Amount(
      erc20Amounts,
      this.erc20InfoA,
    );
    this.addLiquidityData = await this.getAddLiquidityData(
      networkName,
      erc20AmountA,
    );

    return [
      new ApproveERC20SpenderStep(
        this.addLiquidityData.routerContract,
        this.erc20InfoA,
      ),
      new ApproveERC20SpenderStep(
        this.addLiquidityData.routerContract,
        this.erc20InfoB,
      ),
      new UniV2LikeAddLiquidityStep(this.uniswapV2Fork, this.addLiquidityData),
    ];
  }
}
