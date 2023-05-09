import {
  RecipeAddLiquidityData,
  RecipeERC20Amount,
  RecipeOutput,
} from '../../models/export-models';
import { compareERC20Info } from '../../utils';
import { Recipe } from '../recipe';
import { CookbookDebug } from '../../utils/cookbook-debug';
import { BigNumber } from 'ethers';
import { NetworkName } from '@railgun-community/shared-models';

export abstract class AddLiquidityRecipe extends Recipe {
  protected addLiquidityData: Optional<RecipeAddLiquidityData>;

  protected abstract getAddLiquidityData(
    networkName: NetworkName,
    erc20AmountA: RecipeERC20Amount,
  ): Promise<RecipeAddLiquidityData>;

  getExpectedLPAmountFromRecipeOutput(
    recipeOutput: Optional<RecipeOutput>,
  ): Optional<{
    aUnshieldFee: BigNumber;
    bUnshieldFee: BigNumber;
    lpAmount: BigNumber;
    lpMinimum: BigNumber;
    lpShieldFee: BigNumber;
  }> {
    try {
      if (!recipeOutput) {
        return undefined;
      }
      if (!this.addLiquidityData) {
        return undefined;
      }

      const { erc20AmountA, erc20AmountB, expectedLPAmount } =
        this.addLiquidityData;

      const unshieldStepOutput = recipeOutput.stepOutputs[0];
      const unshieldFeeA = unshieldStepOutput.feeERC20AmountRecipients.find(
        fee => {
          return compareERC20Info(fee, erc20AmountA);
        },
      );
      if (!unshieldFeeA) {
        throw new Error('Expected one unshield fee to match token A.');
      }
      const unshieldFeeB = unshieldStepOutput.feeERC20AmountRecipients.find(
        fee => {
          return compareERC20Info(fee, erc20AmountB);
        },
      );
      if (!unshieldFeeB) {
        throw new Error('Expected one unshield fee to match token B.');
      }

      const shieldStepOutput =
        recipeOutput.stepOutputs[recipeOutput.stepOutputs.length - 1];
      const shieldFee = shieldStepOutput.feeERC20AmountRecipients.find(fee => {
        return compareERC20Info(fee, expectedLPAmount);
      });
      if (!shieldFee) {
        throw new Error('Expected shield fee to match LP token.');
      }

      const output = shieldStepOutput.outputERC20Amounts.find(outputAmount => {
        return compareERC20Info(outputAmount, expectedLPAmount);
      });
      if (!output) {
        throw new Error('Expected output to match LP token.');
      }

      return {
        aUnshieldFee: unshieldFeeA.amount,
        bUnshieldFee: unshieldFeeB.amount,
        lpAmount: output.expectedBalance,
        lpMinimum: output.minBalance,
        lpShieldFee: shieldFee.amount,
      };
    } catch (err) {
      if (!(err instanceof Error)) {
        throw err;
      }
      CookbookDebug.error(err);
      return undefined;
    }
  }
}
