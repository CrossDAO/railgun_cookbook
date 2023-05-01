import { BigNumber } from '@ethersproject/bignumber';
import {
  RecipeERC20AmountRecipient,
  StepInput,
  StepOutputERC20Amount,
  UnvalidatedStepOutput,
} from '../../models/export-models';
import { Step } from '../step';
import { getWrappedBaseToken } from './wrap-util';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { RelayAdaptContract } from '../../contract/adapt/relay-adapt-contract';
import { compareERC20Info } from '../../utils/token';

export class UnwrapBaseTokenStep extends Step {
  readonly config = {
    name: 'Unwrap Base Token',
    description: 'Unwraps wrapped token into base token, ie WETH to ETH.',
  };

  private readonly amount: Optional<BigNumber>;

  constructor(amount?: BigNumber) {
    super();
    this.amount = amount;
  }

  protected async getStepOutput(
    input: StepInput,
  ): Promise<UnvalidatedStepOutput> {
    const { networkName, erc20Amounts } = input;

    const wrappedBaseToken = getWrappedBaseToken(networkName);
    const { erc20AmountForStep, unusedERC20Amounts } =
      this.getValidInputERC20Amount(erc20Amounts, erc20Amount =>
        compareERC20Info(erc20Amount, wrappedBaseToken),
      );

    const contract = new RelayAdaptContract(input.networkName);

    const populatedTransactions: PopulatedTransaction[] = [
      await contract.createBaseTokenUnwrap(this.amount),
    ];

    const unwrappedBaseERC20Amount: StepOutputERC20Amount = {
      ...erc20AmountForStep,
      isBaseToken: false,
      expectedBalance: this.amount ?? erc20AmountForStep.expectedBalance,
      minBalance: this.amount ?? erc20AmountForStep.minBalance,
    };
    const spentWrappedERC20Amount: RecipeERC20AmountRecipient = {
      ...wrappedBaseToken,
      amount: this.amount ?? erc20AmountForStep.expectedBalance,
      recipient: 'Wrapped Token Contract',
    };

    return {
      populatedTransactions,
      spentERC20Amounts: [spentWrappedERC20Amount],
      outputERC20Amounts: [unwrappedBaseERC20Amount, ...unusedERC20Amounts],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
