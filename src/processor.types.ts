export interface PoolCreatedEventDecodedData {
  sender: string;
  id: string;
  value_x: bigint;
  value_y: bigint;
  shares: bigint;
}

export interface AddLiquidityEventDecodedData {
  id: string;
  sender: string;
  coin_x_amount: bigint;
  coin_y_amount: bigint;
  shares_minted: bigint;
}

export interface RemoveLiquidityEventDecodedData {
  id: string;
  sender: string;
  coin_x_out: bigint;
  coin_y_out: bigint;
  shares_destroyed: bigint;
}

export interface SwapTokenXEventDecodedData {
  id: string;
  sender: string;
  coin_x_in: bigint;
  coin_y_out: bigint;
}

export interface SwapTokenYEventDecodedData {
  id: string;
  sender: string;
  coin_y_in: bigint;
  coin_x_out: bigint;
}

interface Fields {
  balance_x: string;
  balance_x_cumulative_last: string;
  balance_y: string;
  balance_y_cumulative_last: string;
  decimals_x: string;
  decimals_y: string;
}

export interface SelfTemplate {
  dataType: string;
  fields: Fields;
  hasPublicTransfer: boolean;
  type: string;
}
