import { TestProcessorServer } from '@sentio/sdk/testing';

describe('Test Processor', () => {
  const service = new TestProcessorServer(() => import('./processor.js'));

  beforeAll(async () => {
    await service.start();
  });

  // test('onEventPoolCreated', async () => {
  //   const resp = await service.sui.testEvent(SUI_CREATE_POOL_TX);
  //   console.log(resp);
  // });
});
