import {snakeCase} from 'lodash';

/**
 * Generates the code for checking that the environment variables for this
 * table's name has been set.
 */
export function ensureTableTemplate(objType: string): string {
  return `  unpackTableNames();
  const tableName = process.env.${snakeCase(objType).toUpperCase()};
  assert(tableName, '${snakeCase(objType).toUpperCase()} is not set');`;
}
