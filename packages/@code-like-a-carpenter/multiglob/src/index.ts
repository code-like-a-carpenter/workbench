import type {IOptions} from 'glob';
import glob from 'glob';

import {assert} from '@code-like-a-carpenter/assert';

export function multiglob(patterns: string[], options: IOptions): string[] {
  assert(
    !patterns.some((pattern) => pattern.startsWith('!')),
    'Subtractive patterns are not supported at this time. Please avoid starting your patterns with "!"'
  );

  return patterns.flatMap((pattern) => glob.sync(pattern, options));
}
