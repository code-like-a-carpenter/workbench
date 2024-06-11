import {existsSync} from 'node:fs';
import path from 'node:path';

import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import snakeCase from 'lodash.snakecase';

import {assert} from '@code-like-a-carpenter/assert';
import {getStackName} from '@code-like-a-carpenter/tooling-common';

/**
 * Find the stacks for a given set of projects.
 *
 * @param {Map<string, string>} projects - A map of project names to their package.json paths.
 * @returns {Promise<readonly string[]>} - A promise that resolves to an array of stack names.
 */
export async function findStacks(projects) {
  return Array.from(projects.entries())
    .filter(([, packageJsonPath]) => {
      const projectPath = path.dirname(packageJsonPath);
      return (
        existsSync(path.join(projectPath, 'api.yml')) ||
        existsSync(path.join(projectPath, 'api.json'))
      );
    })
    .map(([projectName]) => getStackName(projectName));
}

/**
 * Find the endpoints for a given set of stacks.
 *
 * @param {readonly string[]} stacks - An array of stack names.
 * @returns {Promise<Map<string, string>>} - A promise that resolves to a map of stack names to their endpoints.
 */
export async function findEndpoints(stacks) {
  return new Map(
    await Promise.all(
      stacks.map(async (stackName) => {
        /** @type {[string, string]} */
        const ret = [stackName, await getStackUrl(stackName)];
        return ret;
      })
    )
  );
}

/**
 * Get the URL for a given stack.
 *
 * @param {string} stackName - The name of the stack.
 * @returns {Promise<string>} - A promise that resolves to the URL of the stack.
 */
async function getStackUrl(stackName) {
  // If we aleady have an AWS_SECRET_ACCESS_KEY, don't try to to use autoloading
  if (!process.env.CI && !process.env.AWS_SECRET_ACCESS_KEY) {
    process.env.AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
    process.env.AWS_PROFILE = process.env.AWS_PROFILE ?? 'webstorm_playground';
    process.env.AWS_SDK_LOAD_CONFIG = process.env.AWS_SDK_LOAD_CONFIG ?? '1';
  }

  const client = process.env.AWS_ENDPOINT
    ? new CloudFormationClient({
        endpoint: process.env.AWS_ENDPOINT,
      })
    : new CloudFormationClient({});

  const stackData = await client.send(
    new DescribeStacksCommand({
      StackName: stackName,
    })
  );

  const stack = stackData.Stacks?.find((s) => s.StackName === stackName);
  assert(stack, `AWS should have returned a stack named "${stackName}"`);
  assert(stack.Outputs, `AWS should have returned stack outputs`);

  const output = stack.Outputs.find((o) => o.OutputKey === 'ApiUrl');
  assert(output, `Could not find output "ApiUrl" in stack ${stackName}`);
  const name = snakeCase(output.OutputKey).toUpperCase();
  assert(name, `AWS should have returned a parameter name`);
  const value = output.OutputValue;
  assert(typeof value === 'string', `AWS should have returned a string value`);

  return value;
}
