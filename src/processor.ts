import { SuiNetwork, SuiObjectProcessorTemplate } from '@sentio/sdk/sui';

import { DEX_PACKAGE_ID, WHITELISTED_POOLS } from './constants.js';
import {
  calculateAmountsInUSD,
  getCoinInfo,
  getCoinsFromPoolType,
  getPoolBalances,
  parsePoolEventsTypeArg,
  recordTradingVolume,
  registerPool,
  removeDecimals,
  tvlByCoin,
  tvlByPool,
} from './lib/index.js';
import {
  AddLiquidityEventDecodedData,
  PoolCreatedEventDecodedData,
  RemoveLiquidityEventDecodedData,
  SelfTemplate,
  SwapTokenXEventDecodedData,
  SwapTokenYEventDecodedData,
} from './processor.types.js';
import { core } from './types/sui/dex.js';

const template = new SuiObjectProcessorTemplate().onTimeInterval(
  async (self: SelfTemplate, __, ctx) => {
    if (!self || !WHITELISTED_POOLS[ctx.objectId] || !self.fields) {
      return;
    }
    try {
      const poolId = ctx.objectId;

      const { coinXType, coinYType } = getCoinsFromPoolType(self.type);

      const isStable = self.type.includes('Stable');

      const poolInfo = await registerPool({
        ctx,
        coinXType,
        coinYType,
        isStable,
        poolId,
      });

      const coinInfoX = await getCoinInfo({
        ctx,
        coinType: poolInfo.coinXType,
      });

      const coinInfoY = await getCoinInfo({
        ctx,
        coinType: poolInfo.coinYType,
      });

      const balanceX = self.fields.balance_x;
      const balanceY = self.fields.balance_y;

      const coinXAmount = removeDecimals({
        value: BigInt(balanceX),
        coinInfo: coinInfoX,
      });

      const coinYAmount = removeDecimals({
        value: BigInt(balanceY),
        coinInfo: coinInfoY,
      });

      const [valueX, valueY] = await calculateAmountsInUSD({
        poolId,
        date: ctx.timestamp,
      });

      if (!valueX && !valueY) return;

      const totalValueX = valueX ? coinXAmount * valueX : coinYAmount * valueY;
      const totalValueY = valueY ? coinYAmount * valueY : coinXAmount * valueX;

      tvlByPool.record(ctx, totalValueX + totalValueY, {
        pair: poolInfo.name,
        poolId: poolInfo.poolId,
      });

      const bridgeX: { bridge: string } | object = coinInfoX.bridge
        ? { bridge: coinInfoX.bridge as string }
        : {};
      const bridgeY: { bridge: string } | object = coinInfoY.bridge
        ? { bridge: coinInfoY.bridge as string }
        : {};

      tvlByCoin.record(ctx, totalValueX, {
        coin: coinInfoX.symbol,
        type: coinInfoX.type,
        ...bridgeX,
      });

      tvlByCoin.record(ctx, totalValueY, {
        coin: coinInfoY.symbol,
        type: coinInfoY.type,
        ...bridgeY,
      });
    } catch {
      console.log('Failed to get data for', ctx.objectId);
    }
  },
  240,
  60,
  undefined,
  { owned: false },
);

core
  .bind({
    address: DEX_PACKAGE_ID,
    network: SuiNetwork.MAIN_NET,
    startCheckpoint: 1500000n,
  })
  .onEventPoolCreated(async (event, ctx) => {
    ctx.meter.Counter('num_pools').add(1);

    const { sender, id } = event.data_decoded as PoolCreatedEventDecodedData;

    const { coinXType, coinYType, isStable } = parsePoolEventsTypeArg(
      event.type_arguments,
    );

    const poolInfo = await registerPool({
      ctx,
      coinXType,
      coinYType,
      isStable,
      poolId: id,
    });

    ctx.eventLogger.emit('Create Pair', {
      distinctId: sender,
      pair: poolInfo.name,
      poolId: id,
      message: `Created ${poolInfo.name}`,
    });

    template.bind(
      {
        objectId: id,
      },
      ctx,
    );
  })
  .onEventAddLiquidity(async (event, ctx) => {
    ctx.meter.Counter('event_liquidity_add').add(1);

    const {
      sender,
      id: poolId,
      coin_x_amount,
      coin_y_amount,
    } = event.data_decoded as AddLiquidityEventDecodedData;

    const { coinXType, coinYType, isStable } = parsePoolEventsTypeArg(
      event.type_arguments,
    );

    const poolInfo = await registerPool({
      ctx,
      coinXType,
      coinYType,
      isStable,
      poolId,
    });

    const coinInfoX = await getCoinInfo({ ctx, coinType: coinXType });
    const coinInfoY = await getCoinInfo({ ctx, coinType: coinYType });

    const coinXAmount = removeDecimals({
      value: coin_x_amount,
      coinInfo: coinInfoX,
    });

    const coinYAmount = removeDecimals({
      value: coin_y_amount,
      coinInfo: coinInfoY,
    });

    const [valueX, valueY] = await calculateAmountsInUSD({
      poolId,
      date: ctx.timestamp,
    });

    const { balanceX, balanceY } = await getPoolBalances({
      ctx,
      poolId,
      coinInfoX,
      coinInfoY,
    });

    const totalXValue = valueX
      ? valueX * coinXAmount
      : (balanceY / balanceX) * coinXAmount * valueY;

    const totalYValue = valueY
      ? valueY * coinYAmount
      : (balanceX / balanceY) * coinYAmount * valueX;

    const totalUSDValueAdded = totalXValue + totalYValue;

    ctx.eventLogger.emit('Add Liquidity', {
      distinctId: sender,
      poolId: poolId,
      pair: poolInfo.name,
      value: totalUSDValueAdded,
      message: `Add USD$${totalUSDValueAdded} Liquidity in ${poolInfo.name}`,
    });

    if (!WHITELISTED_POOLS[poolId]) return;

    ctx.meter.Gauge('add_liquidity').record(totalUSDValueAdded, {
      pair: poolInfo.name,
      poolId: poolInfo.poolId,
    });
  })
  .onEventRemoveLiquidity(async (event, ctx) => {
    ctx.meter.Counter('event_liquidity_removed').add(1);

    const {
      sender,
      id: poolId,
      coin_y_out,
      coin_x_out,
    } = event.data_decoded as RemoveLiquidityEventDecodedData;

    const { coinXType, coinYType, isStable } = parsePoolEventsTypeArg(
      event.type_arguments,
    );

    const poolInfo = await registerPool({
      ctx,
      coinXType,
      coinYType,
      isStable,
      poolId,
    });

    const coinInfoX = await getCoinInfo({ ctx, coinType: coinXType });
    const coinInfoY = await getCoinInfo({ ctx, coinType: coinYType });

    const coinXAmount = removeDecimals({
      value: coin_x_out,
      coinInfo: coinInfoX,
    });

    const coinYAmount = removeDecimals({
      value: coin_y_out,
      coinInfo: coinInfoY,
    });

    const [valueX, valueY] = await calculateAmountsInUSD({
      poolId,
      date: ctx.timestamp,
    });

    const { balanceX, balanceY } = await getPoolBalances({
      ctx,
      poolId,
      coinInfoX,
      coinInfoY,
    });

    const totalXValue = valueX
      ? valueX * coinXAmount
      : (balanceY / balanceX) * coinXAmount * valueY;

    const totalYValue = valueY
      ? valueY * coinYAmount
      : (balanceX / balanceY) * coinYAmount * valueX;

    const totalUSDValueAdded = totalXValue + totalYValue;

    ctx.eventLogger.emit('Remove Liquidity', {
      distinctId: sender,
      poolId: poolId,
      value: totalUSDValueAdded,
      pair: poolInfo.name,
      message: `Remove $${totalUSDValueAdded} Liquidity in ${poolInfo.name}`,
    });

    if (!WHITELISTED_POOLS[poolId]) return;

    ctx.meter.Gauge('remove_liquidity').record(totalUSDValueAdded, {
      poolName: poolInfo.name,
      poolId: poolInfo.poolId,
    });
  })
  .onEventSwapTokenX(async (event, ctx) => {
    ctx.meter.Counter('event_swap').add(1);

    const {
      id: poolId,
      sender,
      coin_y_out,
      coin_x_in,
    } = event.data_decoded as SwapTokenXEventDecodedData;

    const [curve_type, coinXType, coinYType] = event.type_arguments;

    const poolInfo = await registerPool({
      ctx,
      coinXType,
      coinYType,
      isStable: curve_type.includes('Stable'),
      poolId,
    });

    const coinInfoX = await getCoinInfo({ ctx, coinType: coinXType });
    const coinInfoY = await getCoinInfo({ ctx, coinType: coinYType });

    const coinXAmount =
      coinInfoX.decimals > 0
        ? Number(coin_x_in) / Math.pow(10, coinInfoX.decimals)
        : Number(coin_x_in);

    const coinYAmount =
      coinInfoY.decimals > 0
        ? Number(coin_y_out) / Math.pow(10, coinInfoY.decimals)
        : Number(coin_y_out);

    const [valueX, valueY] = await calculateAmountsInUSD({
      poolId,
      date: ctx.timestamp,
    });

    const { balanceX, balanceY } = await getPoolBalances({
      ctx,
      poolId,
      coinInfoX,
      coinInfoY,
    });

    const totalXValue = valueX
      ? valueX * coinXAmount
      : Number(balanceY / balanceX) * coinXAmount * valueY;

    const totalYValue = valueY
      ? valueY * coinYAmount
      : Number(balanceX / balanceY) * coinYAmount * valueX;

    const swappedValue = totalXValue > totalYValue ? totalXValue : totalYValue;

    ctx.eventLogger.emit('Swap', {
      distinctId: sender,
      poolId: poolId,
      value: swappedValue,
      pair: poolInfo.name,
      message: `Swapped ${coinXAmount} ${coinInfoX.symbol} ->  ${coinYAmount} ${coinInfoY.symbol}. USD value ${swappedValue} in ${poolInfo.name}`,
    });

    if (!WHITELISTED_POOLS[poolId]) return;

    await recordTradingVolume({
      ctx,
      valueX: totalXValue,
      valueY: totalYValue,
      poolInfo,
    });
  })
  .onEventSwapTokenY(async (event, ctx) => {
    ctx.meter.Counter('event_swap').add(1);

    const {
      id: poolId,
      sender,
      coin_y_in,
      coin_x_out,
    } = event.data_decoded as SwapTokenYEventDecodedData;

    const [curve_type, coinXType, coinYType] = event.type_arguments;

    const poolInfo = await registerPool({
      ctx,
      coinXType,
      coinYType,
      isStable: curve_type.includes('Stable'),
      poolId,
    });

    const coinInfoX = await getCoinInfo({ ctx, coinType: coinXType });
    const coinInfoY = await getCoinInfo({ ctx, coinType: coinYType });

    const coinXAmount =
      coinInfoX.decimals > 0
        ? Number(coin_x_out) / Math.pow(10, coinInfoX.decimals)
        : Number(coin_x_out);

    const coinYAmount =
      coinInfoY.decimals > 0
        ? Number(coin_y_in) / Math.pow(10, coinInfoY.decimals)
        : Number(coin_y_in);

    const [valueX, valueY] = await calculateAmountsInUSD({
      poolId,
      date: ctx.timestamp,
    });

    const { balanceX, balanceY } = await getPoolBalances({
      ctx,
      poolId,
      coinInfoX,
      coinInfoY,
    });

    const totalXValue = valueX
      ? valueX * coinXAmount
      : Number(balanceY / balanceX) * coinXAmount * valueY;

    const totalYValue = valueY
      ? valueY * coinYAmount
      : Number(balanceX / balanceY) * coinYAmount * valueX;

    const swappedValue = totalXValue > totalYValue ? totalXValue : totalYValue;

    ctx.eventLogger.emit('Swap', {
      distinctId: sender,
      poolId: poolId,
      value: swappedValue,
      pair: poolInfo.name,
      message: `Swapped ${coinYAmount} ${coinInfoY.symbol} ->  ${coinXAmount} ${coinInfoX.symbol}. USD value ${swappedValue} in ${poolInfo.name}`,
    });

    if (!WHITELISTED_POOLS[poolId]) return;

    await recordTradingVolume({
      ctx,
      valueX: totalXValue,
      valueY: totalYValue,
      poolInfo,
    });
  });
