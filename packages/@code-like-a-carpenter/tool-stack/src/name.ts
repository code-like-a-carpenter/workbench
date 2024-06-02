import {assert, fail} from '@code-like-a-carpenter/assert';
import {getStackName} from '@code-like-a-carpenter/tooling-common';

import type {StackNameSchema} from './__generated__/name-types';

export async function handler(args: StackNameSchema): Promise<void> {
  if ('projectName' in args) {
    assert(
      typeof args.projectName === 'string',
      'projectName must be a string'
    );
    console.log(getStackName(args.projectName));
  } else if ('name' in args) {
    assert(typeof args.name === 'string', 'name must be a string');
    console.log(getStackName(args.name));
  } else {
    fail('One of projectName or name must be provided.');
  }
}
