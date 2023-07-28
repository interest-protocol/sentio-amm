import { SuiContext, SuiObjectContext } from '@sentio/sdk/sui';

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

export enum Bridge {
  Celer = 'Celer',
  Wormhole = 'Wormhole',
}

export enum Chain {
  ETH = 'ETH',
  BSC = 'BSC',
  FTM = 'FTM',
  AVAX = 'AVAX',
  CELO = 'CELO',
  SOLANA = 'SOLANA',
  POLYGON = 'POLYGON',
}

export interface CoinInfo {
  symbol: string;
  name: string;
  decimals: number;
  type: string;
  bridge: null | Bridge;
  sourceChain: Chain | null;
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

export interface RecordTradingVolumeArgs {
  ctx: SuiContext | SuiObjectContext;
  poolInfo: PoolInfo;
  valueX: number;
  valueY: number;
}
