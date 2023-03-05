import path from 'node:path';

import {buildContractTests} from '@code-like-a-carpenter/contract-tests';
import {env} from '@code-like-a-carpenter/env';

buildContractTests({
  baseUrl: env('API_URL'),
  blueprintPath: path.resolve(__dirname, 'apiary.apib'),
});
