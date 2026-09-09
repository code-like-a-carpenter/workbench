import '@code-like-a-carpenter/aws-env-loader';

import assert from 'node:assert';
import {execSync} from 'node:child_process';
import path from 'node:path';

import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import Environment from 'jest-environment-node';
import snakeCase from 'lodash/snakeCase.js';

import {env} from '@code-like-a-carpenter/env';
import {getStackName} from '@code-like-a-carpenter/tooling-common';
import {waitFor} from '@code-like-a-carpenter/wait-for';

type TestEnv = 'aws' | 'localstack';

/** How long to wait for a new REST API's stage to become routable. */
const API_PROPAGATION_TIMEOUT = 60_000;

/** How long a single probe may take before it counts as a failed attempt. */
const API_PROPAGATION_PROBE_TIMEOUT = 10_000;

/**
 * Path appended to `API_URL` to probe the stage. No example defines it, so once
 * the stage is routable API Gateway answers with `Missing Authentication Token`
 * rather than dispatching to a Lambda.
 */
const API_PROPAGATION_PROBE_PATH = 'stage-propagation-probe';

/**
 * API Gateway answers a request for a stage it does not route with a 403 whose
 * body is `{"message": "Forbidden"}`. A stage that does exist answers something
 * else, even for a path the API does not define. A 5xx says nothing either way,
 * so treat it as another reason to keep waiting.
 */
function isStageRoutable(status: number, body: string): boolean {
  if (status >= 500) {
    return false;
  }

  if (status !== 403) {
    return true;
  }

  try {
    return JSON.parse(body).message !== 'Forbidden';
  } catch {
    return true;
  }
}

export default class ExampleEnvironment extends Environment {
  private readonly exampleName: string;
  private readonly stackName: string;
  private readonly testEnv: TestEnv;

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    assert(context.testPath);
    const {testPath} = context;

    assert(testPath.includes(`${path.sep}examples${path.sep}`));
    const [exampleName] = testPath
      .split(`${path.sep}examples${path.sep}`)[1]
      .split(path.sep);

    this.exampleName = exampleName;
    this.stackName = getStackName(exampleName);
    process.env.STACK_NAME = this.stackName;

    const testEnv = env('TEST_ENV', 'localstack');
    assert(
      testEnv === 'aws' || testEnv === 'localstack',
      'TEST_ENV must be set to either "localstack" or "aws"'
    );
    this.testEnv = testEnv;
  }

  async setup() {
    await super.setup();
    this.configureEnvironment();

    if (env('TEST_ENV', 'localstack') === 'localstack') {
      await this.ensureLocalStack();
    }

    await this.deployCloudFormationStack();
    await this.loadEnv();
  }

  async teardown() {
    await super.teardown();
    // Localstack doesn't seem to teardown properly, so we'll just let it
    // disappear when the job exits / rely on manual cleanup locally
    if (env('TEST_ENV', 'localstack') !== 'localstack') {
      await this.destroyCloudFormationStack();
    }
  }

  private configureEnvironment() {
    process.env.TEST_ENV = process.env.TEST_ENV ?? 'aws';
    if (process.env.TEST_ENV === 'localstack') {
      // Set fake credentials for localstack
      process.env.AWS_ACCESS_KEY_ID = 'test';
      process.env.AWS_SECRET_ACCESS_KEY = 'test';
      // use IP, not localhost, because Node 18+ tries IPv6 first, but doesn't
      // fall back to IPv4 if it fails to resolve localhost.
      process.env.AWS_ENDPOINT = 'http://127.0.0.1:4566';
      process.env.AWS_REGION = 'us-east-1';
    } else if (process.env.TEST_ENV === 'aws') {
      if (!process.env.CI) {
        process.env.AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
        process.env.AWS_PROFILE =
          process.env.AWS_PROFILE ?? 'webstorm_playground';
        process.env.AWS_SDK_LOAD_CONFIG =
          process.env.AWS_SDK_LOAD_CONFIG ?? '1';
      }
    } else {
      assert.fail(
        `TEST_ENV must be set to either "localstack" or "aws", received ${process.env.TEST_ENV}`
      );
    }

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('AWS_')) {
        this.global.process.env[key] = value;
      }
    }
  }

  private async ensureLocalStack() {
    execSync('docker-compose up --detach', {
      stdio: 'inherit',
    });

    execSync('npx wait-on http://127.0.0.1:4566', {
      stdio: 'inherit',
    });
  }

  private async deployCloudFormationStack() {
    let shouldDeploy = false;
    if (env('DEPLOY', '')) {
      shouldDeploy = true;
      console.info(`Deploying stack ${this.stackName} because DEPLOY is set`);
    }
    if (!shouldDeploy && !(await this.checkForStack())) {
      shouldDeploy = true;
      console.info(
        `Deploying stack ${this.stackName} because it does not exist`
      );
    }

    if (shouldDeploy) {
      execSync(`./scripts/sam deploy ${this.testEnv} ${this.exampleName}`, {
        stdio: 'inherit',
      });
    }
  }

  private destroyCloudFormationStack() {
    if (!env('RETAIN', '')) {
      execSync(`./scripts/sam destroy ${this.testEnv} ${this.exampleName}`, {
        stdio: 'inherit',
      });
    }
  }

  private async loadEnv() {
    const client = process.env.AWS_ENDPOINT
      ? new CloudFormationClient({
          endpoint: process.env.AWS_ENDPOINT,
        })
      : new CloudFormationClient({});

    const stackData = await client.send(
      new DescribeStacksCommand({
        StackName: this.stackName,
      })
    );

    const stack = stackData.Stacks?.find((s) => s.StackName === this.stackName);
    assert(
      stack,
      `"${this.testEnv}" should have returned a stack named "${this.stackName}"`
    );
    assert(
      stack.Outputs,
      `"${this.testEnv}" should have returned stack outputs`
    );

    for (const output of stack.Outputs) {
      const name = snakeCase(output.OutputKey).toUpperCase();
      assert(name, `"${this.testEnv}" should have returned a parameter name`);
      const value = output.OutputValue;
      assert(!(name in process.env), `Env ${name} already set`);
      console.log(`Setting ${name} to ${value}`);
      this.global.process.env[name] = value;
    }

    if (this.testEnv === 'localstack' && this.global.process.env.API_URL) {
      const url = new URL(this.global.process.env.API_URL);
      const [apiId] = url.hostname.split('.');
      const [stageName] = url.pathname.split('/').filter(Boolean);

      this.global.process.env.API_URL = `http://127.0.0.1:4566/restapis/${apiId}/${stageName}/_user_request_/`;
      console.log({API_URL: this.global.process.env.API_URL});
    }

    if (this.testEnv === 'aws' && this.global.process.env.API_URL) {
      await this.waitForApiPropagation(this.global.process.env.API_URL);
    }

    // tests will get their table names from stack outputs rather than the
    // per-substack env var that the functions use, so we need to make sure
    // unpackTableNames() doesn't throw.
    this.global.process.env.TABLE_NAMES = '{}';
  }

  /**
   * CloudFormation reports `CREATE_COMPLETE` before API Gateway finishes
   * publishing the stage, and requests that land in that window get a 403
   * instead of reaching the code under test. Poll until the stage answers.
   */
  private async waitForApiPropagation(apiUrl: string) {
    const probeUrl = `${apiUrl.replace(/\/$/, '')}/${API_PROPAGATION_PROBE_PATH}`;

    try {
      await waitFor(async () => {
        // The signal covers the body stream as well as the request, so a
        // response that never finishes cannot outlast the retry budget.
        const response = await fetch(probeUrl, {
          signal: AbortSignal.timeout(API_PROPAGATION_PROBE_TIMEOUT),
        });
        const body = await response.text();
        if (!isStageRoutable(response.status, body)) {
          throw new Error(`${probeUrl} answered ${response.status} ${body}`);
        }
      }, API_PROPAGATION_TIMEOUT);
    } catch (err) {
      throw new Error(
        `API Gateway did not route ${apiUrl} within ${API_PROPAGATION_TIMEOUT}ms`,
        {cause: err}
      );
    }
  }

  private async checkForStack(): Promise<boolean> {
    console.info(
      'Checking if stack is deployed. If stack is deployed but out of date, set DEPLOY=true to redeploy.'
    );
    const client = process.env.AWS_ENDPOINT
      ? new CloudFormationClient({
          endpoint: process.env.AWS_ENDPOINT,
        })
      : new CloudFormationClient({});

    try {
      const stackData = await client.send(
        new DescribeStacksCommand({
          StackName: this.stackName,
        })
      );

      const stack = stackData.Stacks?.find(
        (s) => s.StackName === this.stackName
      );

      const stackExists = !!stack;

      if (stackExists) {
        console.info(`Stack ${this.stackName} exists`);
      } else {
        console.info(`Stack ${this.stackName} does not exist`);
      }

      return stackExists;
    } catch (err) {
      if (err instanceof Error && err.name === 'ValidationError') {
        console.info(`Stack ${this.stackName} does not exist`);
        return false;
      }
      console.error('Failed to deploy stack');
      console.error(err);
      throw err;
    }
  }
}
