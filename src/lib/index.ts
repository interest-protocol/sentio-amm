import { Coin, CoinMetadata, SuiObjectResponse } from '@mysten/sui.js';
import { Gauge } from '@sentio/sdk';
import { SuiNetwork } from '@sentio/sdk/sui';
import { getPriceByType } from '@sentio/sdk/utils';

import { COINS_MAP as coinsMap, PRICE_MAP } from './coins.js';
import {
  CalculateAmountsInUSD,
  CoinInfo,
  FetchCoinInfoArgs,
  GetCoinInfoArgs,
  GetPoolBalancesArgs,
  PoolInfo,
  RecordTradingVolumeArgs,
  RegisterPoolArgs,
  RemoveDecimalsArgs,
} from './dex.types.js';

// Cache
const POOLS_MAP: Record<string, PoolInfo> = {};

const COINS_MAP: Record<string, CoinInfo> = { ...coinsMap };

const commonOptions = { sparse: true };
export const volOptions = {
  sparse: true,
  aggregationConfig: {
    intervalInMinutes: [60],
  },
};

export const tvlByCoin = Gauge.register('tvl_by_coin', commonOptions);
export const tvlByPool = Gauge.register('tvl_by_pool', commonOptions);
const volume = Gauge.register('vol', volOptions);
const volumeByCoin = Gauge.register('vol_by_coin', volOptions);

export const parsePoolEventsTypeArg = (x: string[]) => {
  const arr = x[0].split('Pool')[1].split(', ');

  return {
    isStable: x[0].includes('Stable'),
    coinXType: arr[1],
    coinYType: arr[2].slice(0, arr[2].length - 1),
  };
};

const fetchCoinInfo = async ({
  ctx,
  coinType,
}: FetchCoinInfoArgs): Promise<CoinInfo> => {
  try {
    const { symbol, name, decimals }: CoinMetadata =
      await ctx.client.getCoinMetadata({
        coinType,
      });

    return {
      symbol,
      name,
      decimals,
      type: coinType,
      sourceChain: null,
      bridge: null,
    };
  } catch (e: unknown) {
    return {
      symbol: Coin.getCoinSymbol(coinType),
      name: Coin.getCoinSymbol(coinType),
      decimals: 0,
      type: coinType,
      sourceChain: null,
      bridge: null,
    };
  }
};

export const getCoinInfo = async ({
  ctx,
  coinType,
}: GetCoinInfoArgs): Promise<CoinInfo> => {
  const cachedCoinInfo = COINS_MAP[coinType];

  if (cachedCoinInfo) return cachedCoinInfo;

  return fetchCoinInfo({ ctx, coinType });
};

export const registerPool = async ({
  ctx,
  coinXType,
  coinYType,
  isStable,
  poolId,
}: RegisterPoolArgs) => {
  if (POOLS_MAP[poolId]) return POOLS_MAP[poolId];

  const [coinInfoX, coinInfoY] = await Promise.all([
    getCoinInfo({ ctx, coinType: coinXType }),
    getCoinInfo({ ctx, coinType: coinYType }),
  ]);

  COINS_MAP[coinXType] = coinInfoX;
  COINS_MAP[coinYType] = coinInfoY;

  const poolInfo = {
    coinYType,
    coinXType,
    symbolX: coinInfoX.symbol,
    symbolY: coinInfoY.symbol,
    decimalX: coinInfoX.decimals,
    decimalY: coinInfoY.decimals,
    isStable,
    poolId,
    name: `${isStable ? 'stable' : 'volatile'}-${coinInfoX.symbol}/${
      coinInfoY.symbol
    }`,
  };

  POOLS_MAP[poolId] = poolInfo;

  return poolInfo;
};

export async function calculateAmountsInUSD({
  poolId,
  date,
}: CalculateAmountsInUSD): Promise<[number, number]> {
  const poolInfo = POOLS_MAP[poolId];

  const coinXPrice = await getPriceByType(
    SuiNetwork.MAIN_NET,
    PRICE_MAP[poolInfo.coinXType],
    date,
  );

  const coinYPrice = await getPriceByType(
    SuiNetwork.MAIN_NET,
    PRICE_MAP[poolInfo.coinYType],
    date,
  );

  return [coinXPrice || 0, coinYPrice || 0];
}

export const removeDecimals = ({ value, coinInfo }: RemoveDecimalsArgs) => {
  return coinInfo.decimals > 0
    ? Number(value) / Math.pow(10, coinInfo.decimals)
    : Number(value);
};

export const getPoolBalances = async ({
  ctx,
  poolId,
  coinInfoY,
  coinInfoX,
}: GetPoolBalancesArgs) => {
  const obj: SuiObjectResponse = await ctx.client.getObject({
    id: poolId,
    options: { showType: true, showContent: true },
  });

  const balanceX = BigInt(
    (obj?.data?.content.fields.balance_x as string) || '0',
  );
  const balanceY = BigInt(
    (obj?.data?.content.fields.balance_y as string) || '0',
  );

  return {
    balanceX: removeDecimals({ value: balanceX, coinInfo: coinInfoX }),
    balanceY: removeDecimals({ value: balanceY, coinInfo: coinInfoY }),
  };
};

export const getCoinsFromPoolType = (poolType: string) => {
  const type = poolType.split('Pool');
  const poolArgs = type[1];
  const tokens = poolArgs.split(',');
  return {
    coinXType: tokens[1].trim(),
    coinYType: tokens[2].split('>')[0].trim(),
  };
};

export const recordTradingVolume = async ({
  ctx,
  poolInfo,
  valueY,
  valueX,
}: RecordTradingVolumeArgs) => {
  const coinXInfo = await getCoinInfo({ ctx, coinType: poolInfo.coinXType });
  const coinYInfo = await getCoinInfo({ ctx, coinType: poolInfo.coinYType });

  const bridgeX: { bridge: string } | object = coinXInfo.bridge
    ? { bridge: coinXInfo.bridge as string }
    : {};
  const bridgeY: { bridge: string } | object = coinYInfo.bridge
    ? { bridge: coinYInfo.bridge as string }
    : {};

  volume.record(ctx, valueX + valueY, {
    pair: poolInfo.name,
    ...bridgeX,
  });

  if (valueX) {
    volumeByCoin.record(ctx, valueX, {
      coin: coinXInfo.symbol,
      type: coinXInfo.type,
      ...bridgeX,
    });

    if (valueY) {
      volumeByCoin.record(ctx, valueY, {
        coin: coinYInfo.symbol,
        type: coinYInfo.type,
        ...bridgeY,
      });
    }
  }
};
