import {compileFromFile} from 'json-schema-to-typescript';

import {writePrettierFile} from '@code-like-a-carpenter/tooling-common';

/**
 * Generates TypeScript definitions from JSON Schema files
 *
 * @param {Object} options
 * @param {string} options.infile
 * @param {string} options.outfile
 */
export async function jsonSchemaToTypescript({infile, outfile}) {
  const out = await compileFromFile(infile);
  await writePrettierFile(outfile, out);
}
