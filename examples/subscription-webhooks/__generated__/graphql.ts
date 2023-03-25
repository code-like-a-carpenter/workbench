import {AssertionError} from 'node:assert';

import {ConditionalCheckFailedException} from '@aws-sdk/client-dynamodb';
import type {GetCommandInput, UpdateCommandInput} from '@aws-sdk/lib-dynamodb';
import {GetCommand, UpdateCommand} from '@aws-sdk/lib-dynamodb';
import {ServiceException} from '@aws-sdk/smithy-client';
import type {NativeAttributeValue} from '@aws-sdk/util-dynamodb';
import Base64 from 'base64url';

import {assert} from '@code-like-a-carpenter/assert';
import type {ResultType} from '@code-like-a-carpenter/foundation-runtime';
import {
  unmarshallRequiredField,
  unmarshallOptionalField,
  AlreadyExistsError,
  BaseDataLibraryError,
  DataIntegrityError,
  NotFoundError,
  UnexpectedAwsError,
  UnexpectedError,
} from '@code-like-a-carpenter/foundation-runtime';

import {ddbDocClient} from '../../shared-dependencies';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The JavaScript Date object as a database type */
  Date: Date;
  /**
   * An arbitrary object used stored to the database. It will not be typesafe on its
   * own.
   */
  JSONObject: Record<string, unknown>;
}

/** A customer account. */
export interface Account extends Model, Timestamped, Versioned {
  __typename?: 'Account';
  cancelled: Scalars['Boolean'];
  createdAt: Scalars['Date'];
  effectiveDate: Scalars['Date'];
  externalId: Scalars['String'];
  hasEverSubscribed?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  indexedPlanName?: Maybe<Scalars['String']>;
  lastPlanName?: Maybe<Scalars['String']>;
  monthlyPriceInCents?: Maybe<Scalars['Int']>;
  onFreeTrial: Scalars['Boolean'];
  planName?: Maybe<Scalars['String']>;
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/** CDC Event Types */
export type CdcEvent = 'INSERT' | 'MODIFY' | 'REMOVE' | 'UPSERT';

export interface Condition {
  always?: InputMaybe<Scalars['Boolean']>;
  condition?: InputMaybe<Scalars['String']>;
}

/** Configuration specific to a table dispatcher */
export interface DispatcherConfig {
  batchSize?: InputMaybe<Scalars['Int']>;
  maximumRetryAttempts?: InputMaybe<Scalars['Int']>;
  /** Measured in megabytes. */
  memory?: InputMaybe<Scalars['Int']>;
  /**
   * Measured in seconds. Reminder that handlers may need to do retries in-band, so
   * consider making this a relatively high number and using alarms to catch
   * timeouts rather than terminating the function. In order to make space for up
   * to 5 retries, please add sixty seconds to your intended timeout.
   */
  timeout?: InputMaybe<Scalars['Int']>;
}

/** Configuration specific to a model handler */
export interface HandlerConfig {
  /** Measured in megabytes. */
  memory?: InputMaybe<Scalars['Int']>;
  /**
   * Measured in seconds. Reminder that handlers may need to do retries in-band, so
   * consider making this a relatively high number and using alarms to catch
   * timeouts rather than terminating the function. In order to make space for up
   * to 5 retries, please add sixty seconds to your intended timeout.
   */
  timeout?: InputMaybe<Scalars['Int']>;
}

/** A summary of all accounts. */
export interface Metric extends Model, Timestamped, Versioned {
  __typename?: 'Metric';
  count: Scalars['Int'];
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  monthlyRecurringRevenueInCents: Scalars['Int'];
  onFreeTrial: Scalars['Boolean'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/**
 * Models are DynamoDB tables with a key schema that may or may not include a sort key. A Model must be decorated with either @partitionKey or @compositeKey.
 *
 * Note that, while Model does not explicitly implement Node, its `id` field behaves like `Node#id` typically does. This is to avoid defining Node in the injected schema if the consumer's schema also defined Node or defines it differently.
 */
export interface Model {
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/** The Node interface */
export interface Node {
  id: Scalars['ID'];
}

/** A summary of all the accounts on a particular plan. */
export interface PlanMetric extends Model, Timestamped, Versioned {
  __typename?: 'PlanMetric';
  cancelled: Scalars['Boolean'];
  count: Scalars['Int'];
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  monthlyRecurringRevenueInCents: Scalars['Int'];
  onFreeTrial: Scalars['Boolean'];
  planName: Scalars['String'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/** Supported DynamoDB Projection Types. */
export type ProjectionType = 'ALL' | 'KEYS_ONLY';

/**
 * Like Model, but includes a `publicId` field which, unlike `id`, is semantically
 * meaningless. Types implementing PublicModel will have an additional function,
 * `queryByPublicId`, generated. If any of your models implement PublicModel, then
 * the dependencies module must include an `idGenerator()`.
 */
export interface PublicModel {
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  publicId: Scalars['String'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/** The Query type */
export interface Query {
  __typename?: 'Query';
  node?: Maybe<Node>;
}

/** The Query type */
export interface QueryNodeArgs {
  id: Scalars['ID'];
}

/** An event describing a change to a customer's subscription status. */
export interface SubscriptionEvent extends Model, Timestamped, Versioned {
  __typename?: 'SubscriptionEvent';
  cancelled: Scalars['Boolean'];
  createdAt: Scalars['Date'];
  effectiveDate: Scalars['Date'];
  externalId: Scalars['String'];
  id: Scalars['ID'];
  monthlyPriceInCents: Scalars['Int'];
  onFreeTrial: Scalars['Boolean'];
  planName: Scalars['String'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/** Automatically adds a createdAt and updatedAt timestamp to the entity and sets them appropriately. The createdAt timestamp is only set on create, while the updatedAt timestamp is set on create and update. */
export interface Timestamped {
  /** Set automatically when the item is first written */
  createdAt: Scalars['Date'];
  /** Set automatically when the item is updated */
  updatedAt: Scalars['Date'];
}

/** Automatically adds a column to enable optimistic locking. This field shouldn't be manipulated directly, but may need to be passed around by the runtime in order to make updates. */
export interface Versioned {
  version: Scalars['Int'];
}

export interface AccountPrimaryKey {
  externalId: Scalars['String'];
}

export type CreateAccountInput = Omit<
  Account,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;

export type CreateAccountOutput = ResultType<Account>;

export async function createAccount(
  input: Readonly<CreateAccountInput>
): Promise<Readonly<CreateAccountOutput>> {
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccount(input, now);

  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',

        '#gsi1': 'gsi1',
        '#gsi1sk': 'gsi1sk',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),

        ':gsi1': ['PLAN', input.hasEverSubscribed].join('#'),
        ':gsi1sk': ['ACCOUNT', input.cancelled, input.indexedPlanName].join(
          '#'
        ),
      },
      Key: {pk: ['ACCOUNT', input.externalId].join('#'), sk: [].join('#')},
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
      ].join(', '),
    };

    const {
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
      Attributes: item,
    } = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, 'Expected DynamoDB to return an Attributes prop.');
    assert(
      item._et === 'Account',
      () =>
        new DataIntegrityError(
          `Expected to write Account but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccount(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('Account', {
        pk: ['ACCOUNT', input.externalId].join('#'),
        sk: [].join('#'),
      });
    }

    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export type ReadAccountOutput = ResultType<Account>;

/**  */
export async function readAccount(
  input: AccountPrimaryKey
): Promise<Readonly<ReadAccountOutput>> {
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {pk: ['ACCOUNT', input.externalId].join('#'), sk: [].join('#')},
    ReturnConsumedCapacity: 'INDEXES',
    TableName: tableName,
  };

  try {
    const {ConsumedCapacity: capacity, Item: item} = await ddbDocClient.send(
      new GetCommand(commandInput)
    );

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, () => new NotFoundError('Account', input));
    assert(
      item._et === 'Account',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a Account but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccount(item),
      metrics: undefined,
    };
  } catch (err) {
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export interface MarshallAccountOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallAccountInput = Required<
  Pick<Account, 'cancelled' | 'effectiveDate' | 'externalId' | 'onFreeTrial'>
> &
  Partial<
    Pick<
      Account,
      | 'hasEverSubscribed'
      | 'indexedPlanName'
      | 'lastPlanName'
      | 'monthlyPriceInCents'
      | 'planName'
      | 'version'
    >
  >;

/** Marshalls a DynamoDB record into a Account object */
export function marshallAccount(
  input: MarshallAccountInput,
  now = new Date()
): MarshallAccountOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#cancelled = :cancelled',
    '#effectiveDate = :effectiveDate',
    '#externalId = :externalId',
    '#onFreeTrial = :onFreeTrial',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#cancelled': 'cancelled',
    '#effectiveDate': 'effective_date',
    '#externalId': 'external_id',
    '#onFreeTrial': 'on_free_trial',
    '#updatedAt': '_md',
    '#version': '_v',
    '#gsi1': 'gsi1',
    '#gsi1sk': 'gsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'Account',
    ':cancelled': input.cancelled,
    ':effectiveDate':
      input.effectiveDate === null ? null : input.effectiveDate.toISOString(),
    ':externalId': input.externalId,
    ':onFreeTrial': input.onFreeTrial,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,

    ':gsi1': ['PLAN', input.hasEverSubscribed].join('#'),
    ':gsi1sk': ['ACCOUNT', input.cancelled, input.indexedPlanName].join('#'),
  };

  if (
    'hasEverSubscribed' in input &&
    typeof input.hasEverSubscribed !== 'undefined'
  ) {
    ean['#hasEverSubscribed'] = 'has_ever_subscribed';
    eav[':hasEverSubscribed'] = input.hasEverSubscribed;
    updateExpression.push('#hasEverSubscribed = :hasEverSubscribed');
  }

  if (
    'indexedPlanName' in input &&
    typeof input.indexedPlanName !== 'undefined'
  ) {
    ean['#indexedPlanName'] = 'indexed_plan_name';
    eav[':indexedPlanName'] = input.indexedPlanName;
    updateExpression.push('#indexedPlanName = :indexedPlanName');
  }

  if ('lastPlanName' in input && typeof input.lastPlanName !== 'undefined') {
    ean['#lastPlanName'] = 'last_plan_name';
    eav[':lastPlanName'] = input.lastPlanName;
    updateExpression.push('#lastPlanName = :lastPlanName');
  }

  if (
    'monthlyPriceInCents' in input &&
    typeof input.monthlyPriceInCents !== 'undefined'
  ) {
    ean['#monthlyPriceInCents'] = 'monthly_price_in_cents';
    eav[':monthlyPriceInCents'] = input.monthlyPriceInCents;
    updateExpression.push('#monthlyPriceInCents = :monthlyPriceInCents');
  }

  if ('planName' in input && typeof input.planName !== 'undefined') {
    ean['#planName'] = 'plan_name';
    eav[':planName'] = input.planName;
    updateExpression.push('#planName = :planName');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a Account object */
export function unmarshallAccount(item: Record<string, any>): Account {
  let result: Account = {
    cancelled: unmarshallRequiredField(item, 'cancelled', [
      'cancelled',
      'cancelled',
    ]),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    effectiveDate: unmarshallRequiredField(
      item,
      'effectiveDate',
      ['effective_date', 'effectiveDate'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'external_id',
      'externalId',
    ]),
    id: Base64.encode(`Account:${item.pk}#:#${item.sk}`),
    onFreeTrial: unmarshallRequiredField(item, 'onFreeTrial', [
      'on_free_trial',
      'onFreeTrial',
    ]),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('has_ever_subscribed' in item || 'hasEverSubscribed' in item) {
    result = {
      ...result,
      hasEverSubscribed: unmarshallOptionalField(item, 'hasEverSubscribed', [
        'has_ever_subscribed',
        'hasEverSubscribed',
      ]),
    };
  }
  if ('indexed_plan_name' in item || 'indexedPlanName' in item) {
    result = {
      ...result,
      indexedPlanName: unmarshallOptionalField(item, 'indexedPlanName', [
        'indexed_plan_name',
        'indexedPlanName',
      ]),
    };
  }
  if ('last_plan_name' in item || 'lastPlanName' in item) {
    result = {
      ...result,
      lastPlanName: unmarshallOptionalField(item, 'lastPlanName', [
        'last_plan_name',
        'lastPlanName',
      ]),
    };
  }
  if ('monthly_price_in_cents' in item || 'monthlyPriceInCents' in item) {
    result = {
      ...result,
      monthlyPriceInCents: unmarshallOptionalField(
        item,
        'monthlyPriceInCents',
        ['monthly_price_in_cents', 'monthlyPriceInCents']
      ),
    };
  }
  if ('plan_name' in item || 'planName' in item) {
    result = {
      ...result,
      planName: unmarshallOptionalField(item, 'planName', [
        'plan_name',
        'planName',
      ]),
    };
  }

  return result;
}

export interface MetricPrimaryKey {
  onFreeTrial: Scalars['Boolean'];
}

export type CreateMetricInput = Omit<
  Metric,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;

export type CreateMetricOutput = ResultType<Metric>;

export async function createMetric(
  input: Readonly<CreateMetricInput>
): Promise<Readonly<CreateMetricOutput>> {
  const tableName = process.env.TABLE_METRIC;
  assert(tableName, 'TABLE_METRIC is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallMetric(input, now);

  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
      },
      Key: {
        pk: ['BUSINESS_METRIC'].join('#'),
        sk: ['SUMMARY', input.onFreeTrial].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
      ].join(', '),
    };

    const {
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
      Attributes: item,
    } = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, 'Expected DynamoDB to return an Attributes prop.');
    assert(
      item._et === 'Metric',
      () =>
        new DataIntegrityError(
          `Expected to write Metric but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallMetric(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('Metric', {
        pk: ['BUSINESS_METRIC'].join('#'),
        sk: ['SUMMARY', input.onFreeTrial].join('#'),
      });
    }

    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export type ReadMetricOutput = ResultType<Metric>;

/**  */
export async function readMetric(
  input: MetricPrimaryKey
): Promise<Readonly<ReadMetricOutput>> {
  const tableName = process.env.TABLE_METRIC;
  assert(tableName, 'TABLE_METRIC is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['BUSINESS_METRIC'].join('#'),
      sk: ['SUMMARY', input.onFreeTrial].join('#'),
    },
    ReturnConsumedCapacity: 'INDEXES',
    TableName: tableName,
  };

  try {
    const {ConsumedCapacity: capacity, Item: item} = await ddbDocClient.send(
      new GetCommand(commandInput)
    );

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, () => new NotFoundError('Metric', input));
    assert(
      item._et === 'Metric',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a Metric but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallMetric(item),
      metrics: undefined,
    };
  } catch (err) {
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export interface MarshallMetricOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallMetricInput = Required<
  Pick<Metric, 'count' | 'monthlyRecurringRevenueInCents' | 'onFreeTrial'>
> &
  Partial<Pick<Metric, 'version'>>;

/** Marshalls a DynamoDB record into a Metric object */
export function marshallMetric(
  input: MarshallMetricInput,
  now = new Date()
): MarshallMetricOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#count = :count',
    '#monthlyRecurringRevenueInCents = :monthlyRecurringRevenueInCents',
    '#onFreeTrial = :onFreeTrial',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#count': 'count',
    '#monthlyRecurringRevenueInCents': 'monthly_recurring_revenue_in_cents',
    '#onFreeTrial': 'on_free_trial',
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'Metric',
    ':count': input.count,
    ':monthlyRecurringRevenueInCents': input.monthlyRecurringRevenueInCents,
    ':onFreeTrial': input.onFreeTrial,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a Metric object */
export function unmarshallMetric(item: Record<string, any>): Metric {
  const result: Metric = {
    count: unmarshallRequiredField(item, 'count', ['count', 'count']),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    id: Base64.encode(`Metric:${item.pk}#:#${item.sk}`),
    monthlyRecurringRevenueInCents: unmarshallRequiredField(
      item,
      'monthlyRecurringRevenueInCents',
      ['monthly_recurring_revenue_in_cents', 'monthlyRecurringRevenueInCents']
    ),
    onFreeTrial: unmarshallRequiredField(item, 'onFreeTrial', [
      'on_free_trial',
      'onFreeTrial',
    ]),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface PlanMetricPrimaryKey {
  onFreeTrial: Scalars['Boolean'];
  planName: Scalars['String'];
}

export type CreatePlanMetricInput = Omit<
  PlanMetric,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;

export type CreatePlanMetricOutput = ResultType<PlanMetric>;

export async function createPlanMetric(
  input: Readonly<CreatePlanMetricInput>
): Promise<Readonly<CreatePlanMetricOutput>> {
  const tableName = process.env.TABLE_PLAN_METRIC;
  assert(tableName, 'TABLE_PLAN_METRIC is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallPlanMetric(input, now);

  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
      },
      Key: {
        pk: ['BUSINESS_METRIC'].join('#'),
        sk: ['PLAN', input.onFreeTrial, input.planName].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
      ].join(', '),
    };

    const {
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
      Attributes: item,
    } = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, 'Expected DynamoDB to return an Attributes prop.');
    assert(
      item._et === 'PlanMetric',
      () =>
        new DataIntegrityError(
          `Expected to write PlanMetric but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallPlanMetric(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('PlanMetric', {
        pk: ['BUSINESS_METRIC'].join('#'),
        sk: ['PLAN', input.onFreeTrial, input.planName].join('#'),
      });
    }

    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export type ReadPlanMetricOutput = ResultType<PlanMetric>;

/**  */
export async function readPlanMetric(
  input: PlanMetricPrimaryKey
): Promise<Readonly<ReadPlanMetricOutput>> {
  const tableName = process.env.TABLE_PLAN_METRIC;
  assert(tableName, 'TABLE_PLAN_METRIC is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['BUSINESS_METRIC'].join('#'),
      sk: ['PLAN', input.onFreeTrial, input.planName].join('#'),
    },
    ReturnConsumedCapacity: 'INDEXES',
    TableName: tableName,
  };

  try {
    const {ConsumedCapacity: capacity, Item: item} = await ddbDocClient.send(
      new GetCommand(commandInput)
    );

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, () => new NotFoundError('PlanMetric', input));
    assert(
      item._et === 'PlanMetric',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a PlanMetric but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallPlanMetric(item),
      metrics: undefined,
    };
  } catch (err) {
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export interface MarshallPlanMetricOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallPlanMetricInput = Required<
  Pick<
    PlanMetric,
    | 'cancelled'
    | 'count'
    | 'monthlyRecurringRevenueInCents'
    | 'onFreeTrial'
    | 'planName'
  >
> &
  Partial<Pick<PlanMetric, 'version'>>;

/** Marshalls a DynamoDB record into a PlanMetric object */
export function marshallPlanMetric(
  input: MarshallPlanMetricInput,
  now = new Date()
): MarshallPlanMetricOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#cancelled = :cancelled',
    '#count = :count',
    '#monthlyRecurringRevenueInCents = :monthlyRecurringRevenueInCents',
    '#onFreeTrial = :onFreeTrial',
    '#planName = :planName',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#cancelled': 'cancelled',
    '#count': 'count',
    '#monthlyRecurringRevenueInCents': 'monthly_recurring_revenue_in_cents',
    '#onFreeTrial': 'on_free_trial',
    '#planName': 'plan_name',
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'PlanMetric',
    ':cancelled': input.cancelled,
    ':count': input.count,
    ':monthlyRecurringRevenueInCents': input.monthlyRecurringRevenueInCents,
    ':onFreeTrial': input.onFreeTrial,
    ':planName': input.planName,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a PlanMetric object */
export function unmarshallPlanMetric(item: Record<string, any>): PlanMetric {
  const result: PlanMetric = {
    cancelled: unmarshallRequiredField(item, 'cancelled', [
      'cancelled',
      'cancelled',
    ]),
    count: unmarshallRequiredField(item, 'count', ['count', 'count']),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    id: Base64.encode(`PlanMetric:${item.pk}#:#${item.sk}`),
    monthlyRecurringRevenueInCents: unmarshallRequiredField(
      item,
      'monthlyRecurringRevenueInCents',
      ['monthly_recurring_revenue_in_cents', 'monthlyRecurringRevenueInCents']
    ),
    onFreeTrial: unmarshallRequiredField(item, 'onFreeTrial', [
      'on_free_trial',
      'onFreeTrial',
    ]),
    planName: unmarshallRequiredField(item, 'planName', [
      'plan_name',
      'planName',
    ]),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface SubscriptionEventPrimaryKey {
  effectiveDate: Scalars['Date'];
  externalId: Scalars['String'];
}

export type CreateSubscriptionEventInput = Omit<
  SubscriptionEvent,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;

export type CreateSubscriptionEventOutput = ResultType<SubscriptionEvent>;

export async function createSubscriptionEvent(
  input: Readonly<CreateSubscriptionEventInput>
): Promise<Readonly<CreateSubscriptionEventOutput>> {
  const tableName = process.env.TABLE_SUBSCRIPTION_EVENT;
  assert(tableName, 'TABLE_SUBSCRIPTION_EVENT is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallSubscriptionEvent(input, now);

  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
      },
      Key: {
        pk: ['ACCOUNT', input.externalId].join('#'),
        sk: [
          'SUBSCRIPTION_EVENT',
          input.effectiveDate === null
            ? null
            : input.effectiveDate.toISOString(),
        ].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
      ].join(', '),
    };

    const {
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
      Attributes: item,
    } = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, 'Expected DynamoDB to return an Attributes prop.');
    assert(
      item._et === 'SubscriptionEvent',
      () =>
        new DataIntegrityError(
          `Expected to write SubscriptionEvent but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallSubscriptionEvent(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('SubscriptionEvent', {
        pk: ['ACCOUNT', input.externalId].join('#'),
        sk: [
          'SUBSCRIPTION_EVENT',
          input.effectiveDate === null
            ? null
            : input.effectiveDate.toISOString(),
        ].join('#'),
      });
    }

    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export type ReadSubscriptionEventOutput = ResultType<SubscriptionEvent>;

/**  */
export async function readSubscriptionEvent(
  input: SubscriptionEventPrimaryKey
): Promise<Readonly<ReadSubscriptionEventOutput>> {
  const tableName = process.env.TABLE_SUBSCRIPTION_EVENT;
  assert(tableName, 'TABLE_SUBSCRIPTION_EVENT is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.externalId].join('#'),
      sk: [
        'SUBSCRIPTION_EVENT',
        input.effectiveDate === null ? null : input.effectiveDate.toISOString(),
      ].join('#'),
    },
    ReturnConsumedCapacity: 'INDEXES',
    TableName: tableName,
  };

  try {
    const {ConsumedCapacity: capacity, Item: item} = await ddbDocClient.send(
      new GetCommand(commandInput)
    );

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, () => new NotFoundError('SubscriptionEvent', input));
    assert(
      item._et === 'SubscriptionEvent',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a SubscriptionEvent but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallSubscriptionEvent(item),
      metrics: undefined,
    };
  } catch (err) {
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export interface MarshallSubscriptionEventOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallSubscriptionEventInput = Required<
  Pick<
    SubscriptionEvent,
    | 'cancelled'
    | 'effectiveDate'
    | 'externalId'
    | 'monthlyPriceInCents'
    | 'onFreeTrial'
    | 'planName'
  >
> &
  Partial<Pick<SubscriptionEvent, 'version'>>;

/** Marshalls a DynamoDB record into a SubscriptionEvent object */
export function marshallSubscriptionEvent(
  input: MarshallSubscriptionEventInput,
  now = new Date()
): MarshallSubscriptionEventOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#cancelled = :cancelled',
    '#effectiveDate = :effectiveDate',
    '#externalId = :externalId',
    '#monthlyPriceInCents = :monthlyPriceInCents',
    '#onFreeTrial = :onFreeTrial',
    '#planName = :planName',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#cancelled': 'cancelled',
    '#effectiveDate': 'effective_date',
    '#externalId': 'external_id',
    '#monthlyPriceInCents': 'monthly_price_in_cents',
    '#onFreeTrial': 'on_free_trial',
    '#planName': 'plan_name',
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'SubscriptionEvent',
    ':cancelled': input.cancelled,
    ':effectiveDate':
      input.effectiveDate === null ? null : input.effectiveDate.toISOString(),
    ':externalId': input.externalId,
    ':monthlyPriceInCents': input.monthlyPriceInCents,
    ':onFreeTrial': input.onFreeTrial,
    ':planName': input.planName,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a SubscriptionEvent object */
export function unmarshallSubscriptionEvent(
  item: Record<string, any>
): SubscriptionEvent {
  const result: SubscriptionEvent = {
    cancelled: unmarshallRequiredField(item, 'cancelled', [
      'cancelled',
      'cancelled',
    ]),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    effectiveDate: unmarshallRequiredField(
      item,
      'effectiveDate',
      ['effective_date', 'effectiveDate'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'external_id',
      'externalId',
    ]),
    id: Base64.encode(`SubscriptionEvent:${item.pk}#:#${item.sk}`),
    monthlyPriceInCents: unmarshallRequiredField(item, 'monthlyPriceInCents', [
      'monthly_price_in_cents',
      'monthlyPriceInCents',
    ]),
    onFreeTrial: unmarshallRequiredField(item, 'onFreeTrial', [
      'on_free_trial',
      'onFreeTrial',
    ]),
    planName: unmarshallRequiredField(item, 'planName', [
      'plan_name',
      'planName',
    ]),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}
