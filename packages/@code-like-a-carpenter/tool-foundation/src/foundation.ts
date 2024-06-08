import {assert} from '@code-like-a-carpenter/assert';

import type {Foundation} from './__generated__/foundation-types.ts';
import {generateCode} from './lib/index.ts';

export async function handler({
  outputs = ['cloudformation', 'typescript'],
  ...rest
}: Omit<Foundation, 'outputs'> & {
  outputs?: (number | string)[];
}): Promise<void> {
  const typesafe = outputs.map((o) => {
    assert(o === 'cloudformation' || o === 'typescript', `Invalid output ${o}`);
    return o;
  });
  return generateCode({...rest, outputs: typesafe});
}
