import { SuiAddress, SuiContext, SuiObjectContext } from '@sentio/sdk/sui';

export interface PoolInfo {
  symbolX: string;
  symbolY: string;
  decimalX: number;
  decimalY: number;
  coinXType: string;
  coinYType: string;
  isStable: boolean;
  poolId: string;
  name: string;
}

export interface CoinInfo {
  symbol: string;
  name: string;
  decimals: number;
  coinMetadataId: null | SuiAddress;
  type: string;
}

export interface RegisterPoolArgs {
  ctx: SuiContext | SuiObjectContext;
  poolId: string;
  coinXType: string;
  coinYType: string;
  isStable: boolean;
}

export interface GetCoinInfoArgs {
  ctx: SuiContext | SuiObjectContext;
  coinType: string;
}

export interface FetchCoinInfoArgs {
  ctx: SuiContext | SuiObjectContext;
  coinType: string;
}

export interface CalculateAmountsInUSD {
  date: Date;
  poolId: string;
}

export interface GetPoolBalancesArgs {
  ctx: SuiContext | SuiObjectContext;
  poolId: string;
  coinInfoX: CoinInfo;
  coinInfoY: CoinInfo;
}

export interface RemoveDecimalsArgs {
  value: bigint;
  coinInfo: CoinInfo;
}
