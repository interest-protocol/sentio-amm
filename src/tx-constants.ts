import { SuiTransactionBlockResponse } from '@mysten/sui.js';

export const SUI_CREATE_POOL_TX: SuiTransactionBlockResponse = {
  digest: 'FkmzYfiVViy41hVpnnCpwmhkZbSkNstRTJKQFB9gPTp1',
  effects: undefined,
  balanceChanges: undefined,
  objectChanges: undefined,
  checkpoint: undefined,
  errors: [],
  timestampMs: '',
  transaction: undefined,
  events: [
    {
      id: {
        txDigest: 'FkmzYfiVViy41hVpnnCpwmhkZbSkNstRTJKQFB9gPTp1',
        eventSeq: '0',
      },
      packageId:
        '0xd15fcc9307dcf822a6ec40950b8b8331ae2367c4455c568296ed4e1eb8527a75',
      transactionModule: 'interface',
      sender:
        '0xb4536519beaef9d9207af2b5f83ae35d4ac76cc288ab9004b39254b354149d27',
      type: '0xd15fcc9307dcf822a6ec40950b8b8331ae2367c4455c568296ed4e1eb8527a75::core::PoolCreated<0xd15fcc9307dcf822a6ec40950b8b8331ae2367c4455c568296ed4e1eb8527a75::core::Pool<0xd15fcc9307dcf822a6ec40950b8b8331ae2367c4455c568296ed4e1eb8527a75::curve::Volatile, 0x2::sui::SUI, 0xa183e0bb0f2d938be732ccc16709e415ea932f08b8d722d36fe529da2bbd61ea::aipx::AIPX>>',
      parsedJson: {
        id: '0x7f3af04cf002a25d15e6d43f89b16abcd6c5fe85b09591efc213e3aaab75c7e5',
        sender:
          '0xb4536519beaef9d9207af2b5f83ae35d4ac76cc288ab9004b39254b354149d27',
        shares: '17782',
        value_x: '10000000',
        value_y: '10000000000',
      },
      bcs: '22NDRrGerUgeaNwV3pkXTL9Fu6TxMJSwWqsyRwM4M6sELhkpsjFHAaQhxZaeeVovVXzyYmb3PZ4VESRN37Wu3WKc7HmFqD3uxrRFrmGnVrQhFyZtDpLDUgoAW',
    },
  ],
  confirmedLocalExecution: true,
};
