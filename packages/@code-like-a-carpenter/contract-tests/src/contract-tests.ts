import {execSync} from 'child_process';
import path from 'node:path';

import type {compile} from 'dredd-transactions';

import {assert} from '@code-like-a-carpenter/assert';

import {testTransaction} from './tests.ts';

/**
 * This is awful: it calls parse and compile from dredd-transactions using a
 * synchronous child process. I haven't found any other way to make a JS process
 * behave synchronously.
 * @param blueprintPath
 */
export function parseAndCompileSync(
  blueprintPath: string
): ReturnType<typeof compile> {
  assert(path.isAbsolute(blueprintPath), 'blueprintPath must be absolute');

  const script = `
    async function fn() {
      const {compile, parse} = await import('dredd-transactions');
      const fs = await import('fs');
      const blueprint = '${blueprintPath}';
      const api = await fs.promises.readFile(blueprint, 'utf8');

      return await new Promise((resolve, reject) => {
        parse(api, (err, {mediaType, apiElements}) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(compile(mediaType, apiElements));
        });
      });
    }

    (async () => {
      console.log(JSON.stringify(await fn()));
    })();
  `;

  return JSON.parse(execSync(`node -e "${script}"`).toString());
}

export interface BuildContractTestsInput {
  blueprintPath: string;
  baseUrl: string;
}

export function buildContractTests({
  baseUrl,
  blueprintPath,
}: BuildContractTestsInput) {
  const {transactions} = parseAndCompileSync(blueprintPath);

  transactions.forEach((transaction) => {
    it(
      transaction.name,
      async () => {
        await testTransaction(transaction, baseUrl);
      },
      10000
    );
  });
}
