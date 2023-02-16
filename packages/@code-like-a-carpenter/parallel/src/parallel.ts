import {
  captureException,
  runWithNewSpan,
} from '@code-like-a-carpenter/telemetry';

export async function parallelMap<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<Awaited<R>>[]> {
  const name = fn.name ?? 'unknown';

  return runWithNewSpan(
    `parallel ${name}`,
    {
      attributes: {'com.code-like-a-carpenter.parallel.total': items.length},
    },
    async () => {
      return await Promise.allSettled(
        items.map(async (item, index) => {
          return runWithNewSpan(
            `parallel ${name} item`,
            {
              attributes: {
                'com.code-like-a-carpenter.parallel.index': index,
                'com.code-like-a-carpenter.parallel.total': items.length,
              },
            },
            async () => {
              try {
                return await fn(item);
              } catch (err) {
                captureException(err);
                throw err;
              }
            }
          );
        })
      );
    }
  );
}
