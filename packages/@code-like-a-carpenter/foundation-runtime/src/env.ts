import {assert} from '@code-like-a-carpenter/assert';

let unpacked = false;

/**
 * Runs exactly once to unpack the TABLE_NAMES environment variable.
 */
export function unpackTableNames() {
  if (unpacked) {
    return;
  }

  const tables = process.env.TABLE_NAMES;
  assert(
    tables,
    'TABLE_NAMES is a required environment variable. This is likely a codegen bug, but could be related to any post-processing you might do to your CloudFormation template'
  );
  const tableMap = JSON.parse(tables);
  for (const [name, value] of Object.entries(tableMap)) {
    assert(
      typeof value === 'string',
      `TABLE_NAMES must be a map of string to string, but ${name} is ${typeof value}`
    );
    process.env[name] = value;
  }

  unpacked = true;
}
