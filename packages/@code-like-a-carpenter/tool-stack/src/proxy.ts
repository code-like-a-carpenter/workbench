import express from 'express';
import type Server from 'http-proxy';
import httpProxy from 'http-proxy';
import vhost from 'vhost';

import {assert} from '@code-like-a-carpenter/assert';
import {findLocalPackages} from '@code-like-a-carpenter/tooling-common';

import type {StackProxySchema} from './__generated__/proxy-types.ts';
import {findEndpoints, findStacks} from './stacks';

export async function handler(args: StackProxySchema): Promise<void> {
  let stacks: string[] = [];

  if (args.all || args.project) {
    const localPackages = await findLocalPackages();
    if (args.project) {
      const projectSet = new Set(args.project as string[]);
      for (const key of localPackages.keys()) {
        if (!projectSet.has(key)) {
          localPackages.delete(key);
        }
      }
    }
    stacks = stacks.concat(await findStacks(localPackages));
  }

  if (args.stack) {
    stacks = stacks.concat(args.stack as string[]);
  }

  const endpoints = await findEndpoints(stacks);
  if (args.endpoint) {
    args.endpoint.forEach((endpoint, index) => {
      assert(typeof endpoint === 'string', 'endpoint must be a string');
      endpoints.set(`stack${index}`, endpoint);
    });
  }

  await startAllProxies({
    endpoints,
    port: args.port ?? 3000,
  });
}

interface StartAllProxiesOptions {
  readonly endpoints: Map<string, string>;
  readonly port: number;
}

export async function startAllProxies({
  endpoints,
  port,
}: StartAllProxiesOptions) {
  const app = express();
  const stackNames = Array.from(endpoints.keys());

  await Promise.all(
    Array.from(endpoints.entries()).map(async ([stackName, endpoint]) => {
      const proxy = makeProxy(endpoint);
      app.use(
        vhost(`${stackName}.localhost`, (req, res) => {
          proxy.web(req, res);
        })
      );
    })
  );

  app.get('/', (req, res) => {
    res.send(
      `All stacks are available on port ${port} at their kebeb-cased subdomains:.<br><ul>${Array.from(
        endpoints.entries()
      )
        .map(
          ([stackName, endpoint]) =>
            `<li><a href='http://${stackName}.localhost:${port}'>${stackName}.localhost</a> (${endpoint})</li>`
        )
        .join('\n')}</ul>`
    );
  });

  app.get('/proxy-status', async (req, res) => {
    const results = await Promise.allSettled(
      stackNames.map(async (stackName) => {
        try {
          const result = await fetch(
            `http://${stackName}.localhost:${port}/api/v1/ping`
          );
          if (!result.ok) {
            const error = new Error(`Stack ${stackName} is not available`);
            // @ts-expect-error
            error.reason = await result.text();
            throw error;
          }
        } catch (err) {
          if (err instanceof Error) {
            // @ts-expect-error
            err.projectName = stackName;
          }
          throw err;
        }
      })
    );

    const errors = results.filter((r) => r.status === 'rejected');

    if (errors.length) {
      res
        .status(502)
        .send(
          errors.map((e) => {
            assert(e.status === 'rejected', 'Should be rejected');
            return {
              cause: e.reason.cause,
              projectName: e.reason.projectName,
              reason: e.reason.message,
            };
          })
        )
        .end();
    }

    res.status(200).send('OK');
  });

  app.listen(port, () => {
    console.info(`All stacks are available on port ${port}`);
  });
}

function makeProxy(endpoint: string): Server {
  const endpointUrl = new URL(endpoint);

  // There's a bug in http-proxy that prevents it from handling redirects when
  // the target is an object, so we need to convert the url the the desired
  // string.
  // https://github.com/http-party/node-http-proxy/issues/1338
  endpointUrl.protocol = 'https:';
  endpointUrl.port = '443';

  return httpProxy.createProxyServer({
    changeOrigin: true,
    followRedirects: false,
    protocolRewrite: 'http',
    secure: false,
    // There's a bug in http-proxy that prevents it from handling redirects when
    // the target is an object, so we need to convert the url the the desired
    // string.
    // https://github.com/http-party/node-http-proxy/issues/1338
    target: endpointUrl.toString(),
    // target: {
    //   host: endpointUrl.hostname,
    //   path: endpointUrl.pathname,
    //   port: 443,
    //   protocol: 'https:',
    // },
    xfwd: true,
  });
}
