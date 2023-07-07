import { Coin, CoinMetadata, SuiObjectResponse } from '@mysten/sui.js';
import { SuiNetwork } from '@sentio/sdk/sui';
import { getPriceByType } from '@sentio/sdk/utils';

import {
  CalculateAmountsInUSD,
  CoinInfo,
  FetchCoinInfoArgs,
  GetCoinInfoArgs,
  GetPoolFromIdArgs,
  PoolInfo,
  RegisterPoolArgs,
} from './dex.types.js';

// Cache
const POOLS_MAP: Record<string, PoolInfo> = {};

const COINS_MAP: Record<string, CoinInfo> = {};

export const parsePoolEventsTypeArg = (x: string[]) => {
  const arr = x[0].split('Pool')[1].split(', ');

  return {
    isStable: !arr[0].includes('Volatile'),
    coinXType: arr[1],
    coinYType: arr[2].slice(0, arr[2].length - 1),
  };
};

const fetchCoinInfo = async ({ ctx, coinType }: FetchCoinInfoArgs) => {
  try {
    const { symbol, name, decimals, id }: CoinMetadata =
      await ctx.client.getCoinMetadata({
        coinType,
      });

    return {
      symbol,
      name,
      decimals,
      coinMetadataId: id,
      type: coinType,
    };
  } catch (e: unknown) {
    console.log(`${(e as Error)?.message} get coin metadata error ${coinType}`);
  }

  return {
    symbol: Coin.getCoinSymbol(coinType),
    name: Coin.getCoinSymbol(coinType),
    decimals: 0,
    coinMetadataId: null,
    type: coinType,
  };
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
  COINS_MAP[coinXType] = coinInfoY;

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
  ctx,
  amountX,
  amountY,
  poolId,
  date,
}: CalculateAmountsInUSD): Promise<[number, number]> {
  const poolInfo = POOLS_MAP[poolId];

  const coinXPrice = await getPriceByType(
    SuiNetwork.MAIN_NET,
    poolInfo.coinXType,
    date,
  );
  const coinYPrice = await getPriceByType(
    SuiNetwork.MAIN_NET,
    poolInfo.coinYType,
    date,
  );

  const obj: SuiObjectResponse = await ctx.client.getObject({
    id: poolId,
    options: { showType: true, showContent: true },
  });

  const balanceX = Number(obj?.data?.content.fields.balance_x);
  const balanceY = Number(obj?.data?.content.fields.balance_y);

  if (!coinYPrice && !coinXPrice) return [0, 0];

  const valueX = coinXPrice
    ? coinXPrice * amountX
    : (balanceY / balanceX) * amountX * (coinYPrice || 0);

  const valueY = coinYPrice
    ? coinYPrice * amountY
    : (balanceX / balanceY) * amountY * (coinXPrice || 0);

  return [valueX, valueY];
}

const getCoinsFromPoolType = (poolType: string) => {
  const type = poolType.split('Pool');
  const poolArgs = type[1];
  const tokens = poolArgs.split(',');
  return {
    coinXType: tokens[1].trim(),
    coinYType: tokens[2].split('>')[0].trim(),
  };
};

export const getPoolFromId = async ({ ctx, poolId }: GetPoolFromIdArgs) => {
  const data: SuiObjectResponse = await ctx.client.getObject({
    id: poolId,
    options: { showContent: true, showType: true },
  });

  const poolType = data.data.type as string;

  const isStable = poolType.includes('Stable');

  const { coinXType, coinYType } = getCoinsFromPoolType(poolType);

  const poolInfo = POOLS_MAP[poolId]
    ? POOLS_MAP[poolId]
    : await registerPool({
        ctx,
        coinXType,
        coinYType,
        isStable,
        poolId,
      });

  return {
    poolInfo,
    balanceX: data?.data?.content?.fields?.balance_x as string,
    balanceY: data?.data?.content?.fields?.balance_y as string,
  };
};
