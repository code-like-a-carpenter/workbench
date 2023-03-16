import path from 'node:path';

import {buildContractTests} from '@code-like-a-carpenter/contract-tests';
import {env} from '@code-like-a-carpenter/env';

buildContractTests({
  baseUrl: env('API_URL'),
  blueprintPath: path.resolve(__dirname, 'apiary.apib'),
});

describe('html', () => {
  it('returns valid html', async () => {
    const baseUrl = env('API_URL');
    const requestUri = new URL('/', 'https://example.com');

    const uri = new URL(baseUrl);
    uri.pathname = path.join(uri.pathname, requestUri.pathname);
    uri.search = requestUri.search;
    const fullUri = uri.toString();

    const result = await fetch(fullUri);
    expect(result.ok).toBe(true);
    const text = await result.text();

    expect(text).toBe('<html lang="en"><body><h1>It works!</h1></body></html>');
  });
});
