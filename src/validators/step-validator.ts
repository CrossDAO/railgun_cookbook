import { BigNumber } from '@ethersproject/bignumber';
import { StepInput, UnvalidatedStepOutput } from '../models/export-models';

export const validateStepOutput = (
  input: StepInput,
  output: UnvalidatedStepOutput,
) => {
  try {
    validateStepOutputERC20Amounts(input, output);
    validateStepOutputNFTs(input, output);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    throw new Error(`Validation Error: ${err.message}`);
  }
};

const getTokenId = (tokenAddress: string, isBaseToken?: boolean) => {
  return `${tokenAddress}-${isBaseToken ? 'base' : ''}`;
};

const validateStepOutputERC20Amounts = (
  input: StepInput,
  output: UnvalidatedStepOutput,
) => {
  const inputERC20AmountMap: Record<string, BigNumber> = {};
  const outputERC20AmountMap: Record<string, BigNumber> = {};

  // Add all erc20 inputs.
  input.erc20Amounts.forEach(
    ({ tokenAddress, expectedBalance, isBaseToken }) => {
      const id = getTokenId(tokenAddress, isBaseToken);
      inputERC20AmountMap[id] ??= BigNumber.from(0);
      inputERC20AmountMap[id] = inputERC20AmountMap[id].add(expectedBalance);
    },
  );

  // Add all erc20 outputs.
  output.outputERC20Amounts.forEach(
    ({ tokenAddress, expectedBalance, minBalance, isBaseToken }) => {
      const id = getTokenId(tokenAddress, isBaseToken);
      outputERC20AmountMap[id] ??= BigNumber.from(0);
      outputERC20AmountMap[id] = outputERC20AmountMap[id].add(expectedBalance);
      if (expectedBalance.lt(minBalance)) {
        throw new Error('Min balance must be >= expected balance.');
      }
    },
  );
  [...output.spentERC20Amounts, ...output.feeERC20AmountRecipients].forEach(
    ({ tokenAddress, amount, isBaseToken }) => {
      const id = getTokenId(tokenAddress, isBaseToken);
      outputERC20AmountMap[id] ??= BigNumber.from(0);
      outputERC20AmountMap[id] = outputERC20AmountMap[id].add(amount);
    },
  );

  for (const id in inputERC20AmountMap) {
    if (!inputERC20AmountMap[id].eq(outputERC20AmountMap[id])) {
      throw new Error(
        `Input erc20 amounts for ${id} must match total outputs/spent/fees.`,
      );
    }
  }

  // TODO: Combine outputs for same tokens.
};

const validateStepOutputNFTs = (
  input: StepInput,
  output: UnvalidatedStepOutput,
) => {
  const inputNFTMap: Record<string, Record<string, BigNumber>> = {};
  const outputNFTMap: Record<string, Record<string, BigNumber>> = {};

  // Add all NFT inputs.
  input.nfts.forEach(({ nftAddress, tokenSubID, amountString }) => {
    inputNFTMap[nftAddress] ??= {};
    if (BigNumber.from(amountString).gt(1)) {
      throw new Error('NFTs must have amount 1');
    }
    if (inputNFTMap[nftAddress][tokenSubID]) {
      throw new Error(`Duplicate NFT input for ${nftAddress}: ${tokenSubID}`);
    }
    inputNFTMap[nftAddress][tokenSubID] = BigNumber.from(1);
  });

  // Add all NFT outputs.
  [...output.outputNFTs, ...output.spentNFTs].forEach(
    ({ nftAddress, tokenSubID, amountString }) => {
      outputNFTMap[nftAddress] ??= {};
      if (BigNumber.from(amountString).gt(1)) {
        throw new Error('NFTs must have amount 1');
      }
      if (outputNFTMap[nftAddress][tokenSubID]) {
        throw new Error(`Duplicate NFT input for ${nftAddress}: ${tokenSubID}`);
      }
      outputNFTMap[nftAddress][tokenSubID] = BigNumber.from(1);
    },
  );

  for (const nftAddress in inputNFTMap) {
    for (const tokenSubID in inputNFTMap[nftAddress]) {
      if (!outputNFTMap[nftAddress]?.[tokenSubID]) {
        throw new Error(
          `Input NFT ${nftAddress}:${tokenSubID} must match NFT output.`,
        );
      }
    }
  }
};
