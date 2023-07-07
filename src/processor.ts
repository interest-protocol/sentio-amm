import { SuiNetwork, SuiObjectProcessorTemplate } from '@sentio/sdk/sui';

import { DEX_PACKAGE_ID, PROJECT_NAME } from './constants.js';
import {
  calculateAmountsInUSD,
  getCoinInfo,
  getPoolFromId,
  parsePoolEventsTypeArg,
  registerPool,
} from './lib/index.js';
import {
  AddLiquidityEventDecodedData,
  PoolCreatedEventDecodedData,
  RemoveLiquidityEventDecodedData,
  SwapTokenXEventDecodedData,
  SwapTokenYEventDecodedData,
} from './processor.types.js';
import { core } from './types/sui/dex.js';

const template = new SuiObjectProcessorTemplate().onTimeInterval(
  async (_, __, ctx) => {
    try {
      const poolId = ctx.objectId;

      const { poolInfo, balanceX, balanceY } = await getPoolFromId({
        ctx,
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

      const coinXAmount =
        coinInfoX.decimals > 0
          ? Number(balanceX) / Math.pow(10, coinInfoX.decimals)
          : Number(balanceX);

      const coinYAmount =
        coinInfoY.decimals > 0
          ? Number(balanceY) / Math.pow(10, coinInfoY.decimals)
          : Number(balanceY);

      ctx.meter.Gauge('reservesX').record(coinXAmount, {
        poolName: poolInfo.name,
        poolId: poolInfo.poolId,
        symbol: coinInfoX.symbol,
        coinType: coinInfoX.type,
        project: PROJECT_NAME,
      });

      ctx.meter.Gauge('reservesY').record(coinXAmount, {
        poolName: poolInfo.name,
        poolId: poolInfo.poolId,
        symbol: coinInfoY.symbol,
        coinType: coinInfoY.type,
        project: PROJECT_NAME,
      });

      const [valueX, valueY] = await calculateAmountsInUSD({
        ctx,
        poolId,
        amountX: coinXAmount,
        amountY: coinYAmount,
        date: ctx.timestamp,
      });

      ctx.meter.Gauge('TVL').record(valueX + valueY, {
        poolName: poolInfo.name,
        poolId: poolInfo.poolId,
        project: PROJECT_NAME,
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
    ctx.meter.Counter('createPoolCounter').add(1, { project: PROJECT_NAME });

    const { sender, id, value_x, value_y, shares } =
      event.data_decoded as PoolCreatedEventDecodedData;

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

    ctx.eventLogger.emit('PoolCreatedEvent', {
      distinctId: sender,
      poolId: id,
      sender,
      valueX: value_x,
      valueY: value_y,
      project: PROJECT_NAME,
      shares,
      coinXType: poolInfo.coinXType,
      coinYType: poolInfo.coinYType,
      isStable: poolInfo.isStable,
      name: poolInfo.name,
    });

    template.bind(
      {
        objectId: id,
      },
      ctx,
    );
  })
  .onEventAddLiquidity(async (event, ctx) => {
    ctx.meter.Counter('addLiquidityCounter').add(1, { project: PROJECT_NAME });

    const {
      sender,
      id: poolId,
      coin_x_amount,
      coin_y_amount,
      shares_minted,
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

    const coinXAmount =
      coinInfoX.decimals > 0
        ? Number(coin_x_amount) / Math.pow(10, coinInfoX.decimals)
        : Number(coin_x_amount);

    const coinYAmount =
      coinInfoY.decimals > 0
        ? Number(coin_y_amount) / Math.pow(10, coinInfoY.decimals)
        : Number(coin_y_amount);

    const [valueX, valueY] = await calculateAmountsInUSD({
      ctx,
      poolId,
      amountX: coinXAmount,
      amountY: coinYAmount,
      date: ctx.timestamp,
    });

    const totalUSDValueAdded = valueX + valueY;

    ctx.eventLogger.emit('AddLiquidityEvent', {
      distinctId: sender,
      poolId: poolId,
      sender,
      valueX: coin_x_amount,
      valueY: coin_y_amount,
      project: PROJECT_NAME,
      shares: shares_minted,
      coinXType: poolInfo.coinXType,
      coinYType: poolInfo.coinYType,
      isStable: poolInfo.isStable,
      name: poolInfo.name,
      message: `Add USD$${totalUSDValueAdded} Liquidity in ${poolInfo.name}`,
    });

    ctx.meter.Gauge('addLiquidityGauge').record(totalUSDValueAdded, {
      poolName: poolInfo.name,
      poolId: poolInfo.poolId,
    });
  })
  .onEventRemoveLiquidity(async (event, ctx) => {
    ctx.meter
      .Counter('removeLiquidityCounter')
      .add(1, { project: PROJECT_NAME });

    const {
      sender,
      id: poolId,
      shares_destroyed,
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

    const coinXAmount =
      coinInfoX.decimals > 0
        ? Number(coin_x_out) / Math.pow(10, coinInfoX.decimals)
        : Number(coin_x_out);

    const coinYAmount =
      coinInfoY.decimals > 0
        ? Number(coin_y_out) / Math.pow(10, coinInfoY.decimals)
        : Number(coin_y_out);

    const [valueX, valueY] = await calculateAmountsInUSD({
      ctx,
      poolId,
      amountX: coinXAmount,
      amountY: coinYAmount,
      date: ctx.timestamp,
    });

    const totalUSDValueAdded = valueX + valueY;

    ctx.eventLogger.emit('RemoveLiquidityEvent', {
      distinctId: sender,
      poolId: poolId,
      sender,
      valueX: coin_x_out,
      valueY: coin_y_out,
      project: PROJECT_NAME,
      shares: shares_destroyed,
      coinXType: poolInfo.coinXType,
      coinYType: poolInfo.coinYType,
      isStable: poolInfo.isStable,
      name: poolInfo.name,
      message: `Remove $${totalUSDValueAdded} Liquidity in ${poolInfo.name}`,
    });

    ctx.meter.Gauge('removeLiquidityGauge').record(totalUSDValueAdded, {
      poolName: poolInfo.name,
      poolId: poolInfo.poolId,
    });
  })
  .onEventSwapTokenX(async (event, ctx) => {
    ctx.meter.Counter('swapCounter').add(1, { project: PROJECT_NAME });

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
      ctx,
      poolId,
      amountX: coinXAmount,
      amountY: coinYAmount,
      date: ctx.timestamp,
    });

    const swappedValue = valueX > valueY ? valueX : valueY;

    ctx.eventLogger.emit('SwapEvent', {
      distinctId: sender,
      poolId: poolId,
      sender,
      valueIn: coin_x_in,
      valueOut: coin_y_out,
      valueUSD: swappedValue,
      project: PROJECT_NAME,
      coinTypeIn: poolInfo.coinXType,
      coinYTypeOut: poolInfo.coinYType,
      isStable: poolInfo.isStable,
      name: poolInfo.name,
      message: `Swapped ${coinXAmount} ${coinInfoX.symbol} ->  ${coinYAmount} ${coinInfoY.symbol}. USD value ${swappedValue} in ${poolInfo.name}`,
    });

    ctx.meter.Gauge('tradingVolumeGauge').record(swappedValue, {
      poolName: poolInfo.name,
      poolId: poolInfo.poolId,
      project: PROJECT_NAME,
    });
    ctx.meter.Counter('tradingVolumeCounter').add(swappedValue, {
      poolName: poolInfo.name,
      poolId: poolInfo.poolId,
      project: PROJECT_NAME,
    });
  })
  .onEventSwapTokenY(async (event, ctx) => {
    ctx.meter.Counter('swapCounter').add(1, { project: PROJECT_NAME });

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
      ctx,
      poolId,
      amountX: coinXAmount,
      amountY: coinYAmount,
      date: ctx.timestamp,
    });

    const swappedValue = valueX > valueY ? valueX : valueY;

    ctx.eventLogger.emit('SwapEvent', {
      distinctId: sender,
      poolId: poolId,
      sender,
      valueIn: coin_y_in,
      valueOut: coin_x_out,
      valueUSD: swappedValue,
      project: PROJECT_NAME,
      coinTypeIn: poolInfo.coinYType,
      coinTypeOut: poolInfo.coinXType,
      isStable: poolInfo.isStable,
      name: poolInfo.name,
      message: `Swapped ${coinYAmount} ${coinInfoY.symbol} ->  ${coinXAmount} ${coinInfoX.symbol}. USD value ${swappedValue} in ${poolInfo.name}`,
    });

    ctx.meter.Gauge('tradingVolumeGauge').record(swappedValue, {
      poolName: poolInfo.name,
      poolId: poolInfo.poolId,
      project: PROJECT_NAME,
    });
    ctx.meter.Counter('tradingVolumeCounter').add(swappedValue, {
      poolName: poolInfo.name,
      poolId: poolInfo.poolId,
      project: PROJECT_NAME,
    });
  });
