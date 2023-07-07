import { SUI_TYPE_ARG } from '@mysten/sui.js';

import { Bridge, Chain, CoinInfo } from './dex.types.js';

const COINS = {
  SUI: SUI_TYPE_ARG,
  ETH_WORMHOLE_USDC:
    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
  NATIVE_WORMHOLE_ETH:
    '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
  ETH_WORMHOLE_USDT:
    '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
  NATIVE_WORMHOLE_WBNB:
    '0xb848cce11ef3a8f62eccea6eb5b35a12c4c2b1ee1af7755d02d7bd6218e8226f::coin::COIN',
  NATIVE_WORMHOLE_WAVAX:
    '0x1e8b532cca6569cab9f9b9ebc73f8c13885012ade714729aa3b450e0339ac766::coin::COIN',
  NATIVE_WORMHOLE_WFTM:
    '0x6081300950a4f1e2081580e919c210436a1bed49080502834950d31ee55a2396::coin::COIN',
  NATIVE_WORMHOLE_CELO:
    '0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f::coin::COIN',
  NATIVE_WORMHOLE_WMATIC:
    '0xdbe380b13a6d0f5cdedd58de8f04625263f113b3f9db32b3e1983f49e2841676::coin::COIN',
  NATIVE_WORMHOLE_SOL:
    '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
  BSC_WORMHOLE_ADA:
    '0x4eac6573f65e7db5aea5a23e1335993a57e088dcd4aff7934059d9a6311d8655::coin::COIN',
  BSC_WORMHOLE_BTCB:
    '0x5cc7b6ed0ce0d43d08667793f6efe7a34d678a780755dc37ea8bfa8805f63327::coin::COIN',
  BSC_WORMHOLE_USDT:
    '0x603b488c87e0d1df64560a61418c87238d440a29ee39bbd757b0c92d38a35c7c::coin::COIN',
  BSC_WORMHOLE_USDC:
    '0x909cba62ce96d54de25bec9502de5ca7b4f28901747bbf96b76c2e63ec5f1cba::coin::COIN',
  BSC_WORMHOLE_ETH:
    '0x5029d5a94429a73b8036cd67192d9c5e09bbc2c0fee942d50075a9edba66744f::coin::COIN',
  BSC_WORMHOLE_FLOKI:
    '0xbcbbd5c23edf35fc279e21ebc129a1187dbfa5b086c63a8e7ff202865888b27b::coin::COIN',
  BSC_WORMHOLE_DOGE:
    '0xd399b358bd0e835000f6caa8c771a7d186499b6e62d413c2fd6cfed709689f28::coin::COIN',
};

export const COINS_MAP = {
  [COINS.SUI]: {
    decimals: 9,
    symbol: 'SUI',
    type: COINS.SUI,
    name: 'SUI',
    bridge: null,
  },
  [COINS.NATIVE_WORMHOLE_ETH]: {
    decimals: 8,
    symbol: 'ETH',
    type: COINS.NATIVE_WORMHOLE_ETH,
    name: 'Ether',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.ETH,
  },
  [COINS.ETH_WORMHOLE_USDC]: {
    decimals: 6,
    symbol: 'USDC',
    type: COINS.ETH_WORMHOLE_USDC,
    name: 'USD Coin',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.ETH,
  },
  [COINS.ETH_WORMHOLE_USDT]: {
    decimals: 6,
    symbol: 'USDT',
    type: COINS.ETH_WORMHOLE_USDT,
    name: 'USD Tether',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.ETH,
  },
  [COINS.NATIVE_WORMHOLE_WBNB]: {
    decimals: 8,
    symbol: 'WBNB',
    type: COINS.NATIVE_WORMHOLE_WBNB,
    name: 'Wrapped BNB',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
  [COINS.NATIVE_WORMHOLE_SOL]: {
    decimals: 8,
    symbol: 'SOL',
    type: COINS.NATIVE_WORMHOLE_SOL,
    name: 'Solana',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.SOLANA,
  },
  [COINS.NATIVE_WORMHOLE_WAVAX]: {
    decimals: 8,
    symbol: 'WAVAX',
    type: COINS.NATIVE_WORMHOLE_SOL,
    name: 'Wrapped AVAX',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.AVAX,
  },
  [COINS.NATIVE_WORMHOLE_WFTM]: {
    decimals: 8,
    symbol: 'WFTM',
    type: COINS.NATIVE_WORMHOLE_WFTM,
    name: 'Wrapped FTW',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.FTM,
  },
  [COINS.NATIVE_WORMHOLE_CELO]: {
    decimals: 8,
    symbol: 'CELO',
    type: COINS.NATIVE_WORMHOLE_CELO,
    name: 'CELO',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.CELO,
  },
  [COINS.NATIVE_WORMHOLE_WMATIC]: {
    decimals: 8,
    symbol: 'WMATIC',
    type: COINS.NATIVE_WORMHOLE_WMATIC,
    name: 'Wrapped Matic',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.POLYGON,
  },
  [COINS.BSC_WORMHOLE_ADA]: {
    decimals: 8,
    symbol: 'ADA',
    type: COINS.BSC_WORMHOLE_ADA,
    name: 'Cardano',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
  [COINS.BSC_WORMHOLE_BTCB]: {
    decimals: 8,
    symbol: 'WBTCB',
    type: COINS.BSC_WORMHOLE_BTCB,
    name: 'Wrapped Bitcoin Binance',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
  [COINS.BSC_WORMHOLE_USDC]: {
    decimals: 8,
    symbol: 'USDC',
    type: COINS.BSC_WORMHOLE_USDC,
    name: 'USD Coin',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
  [COINS.BSC_WORMHOLE_USDT]: {
    decimals: 8,
    symbol: 'USDT',
    type: COINS.BSC_WORMHOLE_USDT,
    name: 'USD Tether',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
  [COINS.BSC_WORMHOLE_ETH]: {
    decimals: 8,
    symbol: 'WETH',
    type: COINS.BSC_WORMHOLE_ETH,
    name: 'Wrapped Ether',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
  [COINS.BSC_WORMHOLE_FLOKI]: {
    decimals: 8,
    symbol: 'FLOKI',
    type: COINS.BSC_WORMHOLE_FLOKI,
    name: 'FLOKI',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
  [COINS.BSC_WORMHOLE_DOGE]: {
    decimals: 8,
    symbol: 'DOGE',
    type: COINS.BSC_WORMHOLE_DOGE,
    name: 'DOGE',
    bridge: Bridge.Wormhole,
    sourceChain: Chain.BSC,
  },
} as Record<string, CoinInfo>;
