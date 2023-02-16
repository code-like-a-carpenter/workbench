import {captureException} from '@code-like-a-carpenter/telemetry';

import {parallelMap} from './parallel';

jest.mock('@code-like-a-carpenter/telemetry', () => {
  const actual = jest.requireActual('@code-like-a-carpenter/telemetry');
  return {
    ...actual,
    captureException: jest.fn(),
  };
});

describe('parallelMap()', () => {
  it('applies a function to a number if items in parallel', async () => {
    async function double(n: number) {
      return n * 2;
    }

    const items = [1, 2, 3, 4, 5];

    const result = await parallelMap(items, double);
    expect(result).toEqual([
      {status: 'fulfilled', value: 2},
      {status: 'fulfilled', value: 4},
      {status: 'fulfilled', value: 6},
      {status: 'fulfilled', value: 8},
      {status: 'fulfilled', value: 10},
    ]);
  });

  it('captures and suppresses errors', async () => {
    async function double(n: number) {
      if (n === 3) {
        throw new Error('test error');
      }
      return n * 2;
    }

    const items = [1, 2, 3, 4, 5];

    const result = await parallelMap(items, double);
    expect(result).toEqual([
      {status: 'fulfilled', value: 2},
      {status: 'fulfilled', value: 4},
      // eslint-disable-next-line sort-keys
      {status: 'rejected', reason: new Error('test error')},
      {status: 'fulfilled', value: 8},
      {status: 'fulfilled', value: 10},
    ]);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(new Error('test error'));
  });
});
