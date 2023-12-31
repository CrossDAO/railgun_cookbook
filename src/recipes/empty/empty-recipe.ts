import { Recipe } from '../recipe';
import { Step } from '../../steps';
import { EmptyTransferBaseTokenStep } from '../../steps/adapt/empty-transfer-base-token-step';
import { RecipeConfig } from '../../models/export-models';
import { MIN_GAS_LIMIT_EMPTY } from '../../models/min-gas-limits';

export class EmptyRecipe extends Recipe {
  readonly config: RecipeConfig = {
    name: 'Empty Recipe',
    description: 'Empty recipe for testing. Sends 0 tokens to null address.',
    minGasLimit: MIN_GAS_LIMIT_EMPTY,
  };

  constructor() {
    super();
  }

  protected supportsNetwork(): boolean {
    return true;
  }

  protected async getInternalSteps(): Promise<Step[]> {
    return [new EmptyTransferBaseTokenStep()];
  }
}
