import type {Logger} from '@code-like-a-carpenter/logger';
import {ConsoleLogger} from '@code-like-a-carpenter/logger';

import {interact} from './interact.ts';

interface AddNumbersInput {
  a: number;
  b: number;
}

async function addNumbersAndReturnScalar({
  a,
  b,
}: AddNumbersInput): Promise<number> {
  return a + b;
}

async function addNumbersAndReturnObject({
  a,
  b,
}: AddNumbersInput): Promise<{result: number}> {
  return {result: a + b};
}

describe('interact()', () => {
  it('applies an interactor to some arguments', async () => {
    const result = await interact(addNumbersAndReturnScalar, {a: 1, b: 2}, {});
    expect(result).toEqual(3);
  });

  it('applies an interactor which returns an object to some arguments', async () => {
    const result = await interact(addNumbersAndReturnObject, {a: 1, b: 2}, {});
    expect(result).toMatchObject({result: 3});
  });

  it('appends a child logger to the context', async () => {
    async function loggingInteractor(
      {msg}: {msg: string},
      {logger}: {logger: Logger}
    ): Promise<void> {
      logger.info(msg);
    }
    const spy = jest.spyOn(console, 'info').mockReturnValue();
    await interact(
      loggingInteractor,
      {msg: 'hello'},
      // Use a non-dev logger so that the output JSON is 1. sorted and 2. a
      // single line that diffs better in failing test output.
      {logger: new ConsoleLogger({dev: false})}
    );
    expect(spy).toHaveBeenCalledWith(
      JSON.stringify({
        interactor: 'loggingInteractor',
        level: 'info',
        message: 'hello',
      })
    );
  });

  it('runs functions that accept a scalar', async () => {
    async function doubler(x: number): Promise<number> {
      return x * 2;
    }
    const result = await interact(doubler, 2, {});
    expect(result).toEqual(4);
  });
});
