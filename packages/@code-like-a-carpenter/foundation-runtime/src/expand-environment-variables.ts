import {assert} from '@code-like-a-carpenter/assert';

export function expandEnvironmentVariables() {
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

  const envVars = process.env.FOUNDATION_ENVIRONMENT_VARIABLES;
  if (envVars) {
    const env = JSON.parse(envVars);
    for (const [key, value] of Object.entries(env)) {
      assert(
        typeof value === 'string',
        'FOUNDATION_ENVIRONMENT_VARIABLES should only contain string values'
      );
      process.env[key] = value;
    }
  }
}
