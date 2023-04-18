// This file is generated. Do not edit by hand.
import {
  expandTableNames,
  makeReactor,
} from '@code-like-a-carpenter/foundation-runtime';

import {AccountUpsertReactor} from '../../src/react--account--upsert';
import {unmarshallAccount} from '../graphql';
import type {Account} from '../graphql';

expandTableNames();

export const handler = makeReactor<Account>(AccountUpsertReactor, {
  unmarshallSourceModel: unmarshallAccount,
});
