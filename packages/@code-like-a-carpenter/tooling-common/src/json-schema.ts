import {compileFromFile} from 'json-schema-to-typescript';

import {writePrettierFile} from './filesystem';

interface JsonSchemaToTypescriptOptions {
  readonly infile: string;
  readonly outfile: string;
}

export async function jsonSchemaToTypescript({
  infile,
  outfile,
}: JsonSchemaToTypescriptOptions) {
  const out = await compileFromFile(infile);
  await writePrettierFile(outfile, out);
}
