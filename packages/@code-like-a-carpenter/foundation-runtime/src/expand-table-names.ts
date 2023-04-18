import {assert} from '@code-like-a-carpenter/assert';

export function expandTableNames() {
  const tableNames = process.env.FOUNDATION_TABLE_NAMES;
  if (tableNames) {
    const tables = JSON.parse(tableNames);
    for (const [key, value] of Object.entries(tables)) {
      assert(
        typeof value === 'string',
        'FOUNDATION_TABLE_NAMES should only contain string values'
      );
      process.env[key] = value;
    }
  }
}
