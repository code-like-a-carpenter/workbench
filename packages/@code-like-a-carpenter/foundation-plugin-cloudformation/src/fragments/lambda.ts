import fs from 'fs';
import path from 'path';

export function writeLambda(directory: string, code: string): void {
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, 'handler.ts'), code);

  const index = `// This file is generated. Do not edit by hand.

// esbuild and otel instrumentations both attempt to use Object.defineProperty
// to define the \`handler\` property transforming ESM to CJS. The workaround is
// to write the entry point (this file) as CJS.
// See https://github.com/aws-observability/aws-otel-lambda/issues/99
// And https://github.com/open-telemetry/opentelemetry-js-contrib/issues/647

// @ts-ignore - tsc sees every function's index.ts as a shared namespace for
// some reason
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {handler} = require('./handler.ts');
exports.handler = handler;
    `;
  fs.writeFileSync(path.join(directory, 'index.ts'), index);
}
