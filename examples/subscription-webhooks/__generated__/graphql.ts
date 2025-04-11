import {AssertionError} from 'node:assert';

import {ConditionalCheckFailedException} from '@aws-sdk/client-dynamodb';
import type {
  DeleteCommandInput,
  GetCommandInput,
  QueryCommandInput,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import {
  DeleteCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type {NativeAttributeValue} from '@aws-sdk/util-dynamodb';
import {ddbDocClient} from '@clc/dependencies';
import {ServiceException} from '@smithy/smithy-client';
import Base64Import from 'base64url';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  MultiResultType,
  ResultType,
  QueryOptions,
} from '@code-like-a-carpenter/foundation-runtime';
import {
  makeSortKeyForQuery,
  unmarshallRequiredField,
  unmarshallOptionalField,
  unpackTableNames,
  AlreadyExistsError,
  BaseDataLibraryError,
  DataIntegrityError,
  NotFoundError,
  OptimisticLockingError,
  UnexpectedAwsError,
  UnexpectedError,
} from '@code-like-a-carpenter/foundation-runtime';

import {AccountIndexedPlanNameProvider} from '../src/computed-fields.ts';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<T extends {[key: string]: unknown}, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | {[P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never};
const Base64 = Base64Import.default ?? Base64Import;
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: {input: string; output: string};
  String: {input: string; output: string};
  Boolean: {input: boolean; output: boolean};
  Int: {input: number; output: number};
  Float: {input: number; output: number};
  /** JavaScript Date stored as a Number in DynamoDB */
  Date: {input: Date; output: Date};
  /** Arbitrary JSON stored as a Map in DynamoDB */
  JSONObject: {input: Record<string, unknown>; output: Record<string, unknown>};
}

/** A customer account. */
export type Account = Model &
  Timestamped &
  Versioned & {
    __typename?: 'Account';
    cancelled: Scalars['Boolean']['output'];
    createdAt: Scalars['Date']['output'];
    effectiveDate: Scalars['Date']['output'];
    externalId: Scalars['String']['output'];
    hasEverSubscribed?: Maybe<Scalars['Boolean']['output']>;
    id: Scalars['ID']['output'];
    indexedPlanName?: Maybe<Scalars['String']['output']>;
    lastPlanName?: Maybe<Scalars['String']['output']>;
    monthlyPriceInCents?: Maybe<Scalars['Int']['output']>;
    onFreeTrial: Scalars['Boolean']['output'];
    planName?: Maybe<Scalars['String']['output']>;
    updatedAt: Scalars['Date']['output'];
    version: Scalars['Int']['output'];
  };

/** CDC Event Types */
export type CdcEvent = 'INSERT' | 'MODIFY' | 'REMOVE' | 'UPSERT';

/** Possible case types for converting a fieldName to a DynamoDB column_name. */
export type ColumnCase = 'CAMEL_CASE' | 'SNAKE_CASE';

/** Configuration specific to a table dispatcher */
export interface DispatcherConfig {
  lambdaConfig?: InputMaybe<LambdaConfig>;
}

/** Configuration specific to a model handler */
export interface HandlerConfig {
  lambdaConfig?: InputMaybe<LambdaConfig>;
}

/** Reusable options for all generated lambdas */
export interface LambdaConfig {
  /** Measured in megabytes. */
  memory?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Measured in seconds. Reminder that handlers may need to do retries in-band, so
   * consider making this a relatively high number and using alarms to catch
   * timeouts rather than terminating the function. In order to make space for up
   * to 5 retries, please add sixty seconds to your intended timeout.
   */
  timeout?: InputMaybe<Scalars['Int']['input']>;
}

/** A summary of all accounts. */
export type Metric = Model &
  Timestamped &
  Versioned & {
    __typename?: 'Metric';
    count: Scalars['Int']['output'];
    createdAt: Scalars['Date']['output'];
    id: Scalars['ID']['output'];
    monthlyRecurringRevenueInCents: Scalars['Int']['output'];
    onFreeTrial: Scalars['Boolean']['output'];
    updatedAt: Scalars['Date']['output'];
    version: Scalars['Int']['output'];
  };

/**
 * Models are DynamoDB tables with a key schema that may or may not include a sort
 * key. A Model must be decorated with either @partitionKey or @compositeKey.
 *
 * Note that, while Model does not explicitly implement Node, its `id` field
 * behaves like `Node#id` typically does. This is to avoid defining Node in the
 * injected schema if the consumer's schema also defined Node or defines it
 * differently.
 */
export interface Model {
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['Date']['output'];
  version: Scalars['Int']['output'];
}

/** A summary of all the accounts on a particular plan. */
export type PlanMetric = Model &
  Timestamped &
  Versioned & {
    __typename?: 'PlanMetric';
    cancelled: Scalars['Boolean']['output'];
    count: Scalars['Int']['output'];
    createdAt: Scalars['Date']['output'];
    id: Scalars['ID']['output'];
    monthlyRecurringRevenueInCents: Scalars['Int']['output'];
    onFreeTrial: Scalars['Boolean']['output'];
    planName?: Maybe<Scalars['String']['output']>;
    updatedAt: Scalars['Date']['output'];
    version: Scalars['Int']['output'];
  };

/**
 * INCLUDE is omitted at this time because it drastically complicates the schema
 * DSL. If a use for it arises, it'll be revisited.
 */
export type ProjectionType = 'ALL' | 'KEYS_ONLY';

/**
 * Like Model, but includes a `publicId` field which, unlike `id`, is semantically
 * meaningless. Types implementing PublicModel will have an additional function,
 * `queryByPublicId`, generated. If any of your models implement PublicModel, then
 * the dependencies module must include an `idGenerator()`.
 */
export interface PublicModel {
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  publicId: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  version: Scalars['Int']['output'];
}

/** An event describing a change to a customer's subscription status. */
export type SubscriptionEvent = Model &
  Timestamped &
  Versioned & {
    __typename?: 'SubscriptionEvent';
    cancelled: Scalars['Boolean']['output'];
    createdAt: Scalars['Date']['output'];
    effectiveDate: Scalars['Date']['output'];
    externalId: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    monthlyPriceInCents: Scalars['Int']['output'];
    onFreeTrial: Scalars['Boolean']['output'];
    planName?: Maybe<Scalars['String']['output']>;
    updatedAt: Scalars['Date']['output'];
    version: Scalars['Int']['output'];
  };

/**
 * Automatically adds a createdAt and updatedAt timestamp to the entity and sets
 * them appropriately. The createdAt timestamp is only set on create, while the
 * updatedAt timestamp is set on create and update.
 */
export interface Timestamped {
  /** Set automatically when the item is first written */
  createdAt: Scalars['Date']['output'];
  /** Set automatically when the item is updated */
  updatedAt: Scalars['Date']['output'];
}

/**
 * Automatically adds a column to enable optimistic locking. This field shouldn't
 * be manipulated directly, but may need to be passed around by the runtime in
 * order to make updates.
 */
export interface Versioned {
  version: Scalars['Int']['output'];
}

export type AccountPrimaryKey = Pick<Account, 'externalId'>;

export type CreateAccountInput = Omit<
  Account,
  'createdAt' | 'id' | 'indexedPlanName' | 'updatedAt' | 'version'
>;
export type CreateAccountOutput = ResultType<Account>;
/**  */
export async function createAccount(
  _input: Readonly<CreateAccountInput>
): Promise<Readonly<CreateAccountOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');

  const now = new Date();

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallAccountInput = {..._input} as MarshallAccountInput;
  const indexedPlanNameProvider = new AccountIndexedPlanNameProvider();

  Object.defineProperty(input, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      return indexedPlanNameProvider.compute(this);
    },
  });

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
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
      },
      Key: {
        pk: ['ACCOUNT', input.externalId].join('#'),
        sk: ['ACCOUNT'].join('#'),
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
        sk: ['ACCOUNT'].join('#'),
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

export type BlindWriteAccountInput = Omit<
  Account,
  'createdAt' | 'id' | 'indexedPlanName' | 'updatedAt' | 'version'
> &
  Partial<Pick<Account, 'createdAt'>>;

export type BlindWriteAccountOutput = ResultType<Account>;
/** */
export async function blindWriteAccount(
  _input: Readonly<BlindWriteAccountInput>
): Promise<Readonly<BlindWriteAccountOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');
  const now = new Date();

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallAccountInput = {..._input} as MarshallAccountInput;
  const indexedPlanNameProvider = new AccountIndexedPlanNameProvider();

  Object.defineProperty(input, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      return indexedPlanNameProvider.compute(this);
    },
  });

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccount(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['ACCOUNT', input.externalId].join('#'),
      sk: ['ACCOUNT'].join('#'),
    },
    ReturnConsumedCapacity: 'INDEXES',
    ReturnItemCollectionMetrics: 'SIZE',
    ReturnValues: 'ALL_NEW',
    TableName: tableName,
    UpdateExpression: ue,
  };

  try {
    const {
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
      Attributes: item,
    } = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, 'Expected DynamoDB ot return an Attributes prop.');
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
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export type DeleteAccountOutput = ResultType<void>;

/**  */
export async function deleteAccount(
  input: AccountPrimaryKey
): Promise<DeleteAccountOutput> {
  unpackTableNames();
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['ACCOUNT', input.externalId].join('#'),
        sk: ['ACCOUNT'].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'NONE',
      TableName: tableName,
    };

    const {ConsumedCapacity: capacity, ItemCollectionMetrics: metrics} =
      await ddbDocClient.send(new DeleteCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    return {
      capacity,
      item: undefined,
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new NotFoundError('Account', input);
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
  unpackTableNames();
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: true,
    Key: {
      pk: ['ACCOUNT', input.externalId].join('#'),
      sk: ['ACCOUNT'].join('#'),
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

    assert(item, () => new NotFoundError('Account', input));
    assert(
      item._et === 'Account',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a Account but loaded ${item._et} instead`
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

export type UpdateAccountInput = Omit<
  Account,
  'createdAt' | 'id' | 'indexedPlanName' | 'updatedAt'
>;
export type UpdateAccountOutput = ResultType<Account>;

/**  */
export async function updateAccount(
  _input: Readonly<UpdateAccountInput>
): Promise<Readonly<UpdateAccountOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallAccountInput = {..._input} as MarshallAccountInput;
  const indexedPlanNameProvider = new AccountIndexedPlanNameProvider();

  Object.defineProperty(input, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      return indexedPlanNameProvider.compute(this);
    },
  });

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccount(input);
  try {
    let previousVersionCE = '';
    let previousVersionEAV = {};
    if ('version' in input && typeof input.version !== 'undefined') {
      previousVersionCE = '#version = :previousVersion AND ';
      previousVersionEAV = {':previousVersion': input.version};
    }
    const commandInput: UpdateCommandInput = {
      ConditionExpression: `${previousVersionCE}#entity = :entity AND attribute_exists(#pk)`,
      ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ...previousVersionEAV,
      },
      Key: {
        pk: ['ACCOUNT', input.externalId].join('#'),
        sk: ['ACCOUNT'].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression,
    };

    const {
      Attributes: item,
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
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
          `Expected ${JSON.stringify({externalId: input.externalId})} to update a Account but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccount(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readAccount(input);
      } catch {
        throw new NotFoundError('Account', {externalId: input.externalId});
      }
      throw new OptimisticLockingError('Account', {
        externalId: input.externalId,
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

export type QueryAccountInput =
  | {externalId: Scalars['String']['input']}
  | {index: 'gsi1'; hasEverSubscribed?: Maybe<Scalars['Boolean']['input']>}
  | {
      index: 'gsi1';
      cancelled: Scalars['Boolean']['input'];
      hasEverSubscribed?: Maybe<Scalars['Boolean']['input']>;
    }
  | {
      index: 'gsi1';
      cancelled: Scalars['Boolean']['input'];
      hasEverSubscribed?: Maybe<Scalars['Boolean']['input']>;
      indexedPlanName?: Maybe<Scalars['String']['input']>;
    };
export type QueryAccountOutput = MultiResultType<Account>;

function makeEanForQueryAccount(
  input: QueryAccountInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

function makeEavForQueryAccount(input: QueryAccountInput): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['PLAN', input.hasEverSubscribed].join('#'),
        ':sk': makeSortKeyForQuery(
          'ACCOUNT',
          ['cancelled', 'indexedPlanName'],
          input
        ),
      };
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('ACCOUNT', [], input),
    };
  }
}

function makeKceForQueryAccount(
  input: QueryAccountInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${operator === 'begins_with' ? 'begins_with(#sk, :sk)' : `#sk ${operator} :sk`}`;
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${operator === 'begins_with' ? 'begins_with(#sk, :sk)' : `#sk ${operator} :sk`}`;
  }
}

/** queryAccount */
export async function queryAccount(
  input: Readonly<QueryAccountInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryAccountOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_ACCOUNT;
  assert(tableName, 'TABLE_ACCOUNT is not set');

  const ExpressionAttributeNames = makeEanForQueryAccount(input);
  const ExpressionAttributeValues = makeEavForQueryAccount(input);
  const KeyConditionExpression = makeKceForQueryAccount(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: !('index' in input),
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ExclusiveStartKey: nextToken,
    IndexName: 'index' in input ? input.index : undefined,
    KeyConditionExpression,
    Limit: limit,
    ReturnConsumedCapacity: 'INDEXES',
    ScanIndexForward: !reverse,
    TableName: tableName,
  };

  try {
    const {
      ConsumedCapacity: capacity,
      Items: items = [],
      LastEvaluatedKey: lastEvaluatedKey,
    } = await ddbDocClient.send(new QueryCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    return {
      capacity,
      hasNextPage: !!lastEvaluatedKey,
      items: items.map((item) => {
        assert(
          item._et === 'Account',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only Account was expected.`
            )
        );
        return unmarshallAccount(item);
      }),
      nextToken: lastEvaluatedKey,
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

/** queries the Account table by primary key using a node id */
export async function queryAccountByNodeId(
  id: Scalars['ID']['input']
): Promise<Readonly<Omit<ResultType<Account>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryAccountInput = {
    externalId: primaryKeyValues[1],
  };

  const {capacity, items} = await queryAccount(primaryKey);

  assert(items.length > 0, () => new NotFoundError('Account', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple Account with id ${id}`)
  );

  return {capacity, item: items[0]};
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
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
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
    '#gsi1pk': 'gsi1pk',
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
    ':gsi1pk': ['PLAN', input.hasEverSubscribed].join('#'),
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

  const indexedPlanNameProvider = new AccountIndexedPlanNameProvider();

  Object.defineProperty(result, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      return indexedPlanNameProvider.compute(this);
    },
  });

  return result;
}

export type MetricPrimaryKey = Pick<Metric, 'onFreeTrial'>;

export type CreateMetricInput = Omit<
  Metric,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreateMetricOutput = ResultType<Metric>;
/**  */
export async function createMetric(
  input: Readonly<CreateMetricInput>
): Promise<Readonly<CreateMetricOutput>> {
  unpackTableNames();
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
        pk: ['METRIC'].join('#'),
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
        pk: ['METRIC'].join('#'),
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

export type BlindWriteMetricInput = Omit<
  Metric,
  'createdAt' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<Metric, 'createdAt'>>;

export type BlindWriteMetricOutput = ResultType<Metric>;
/** */
export async function blindWriteMetric(
  input: Readonly<BlindWriteMetricInput>
): Promise<Readonly<BlindWriteMetricOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_METRIC;
  assert(tableName, 'TABLE_METRIC is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallMetric(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['METRIC'].join('#'),
      sk: ['SUMMARY', input.onFreeTrial].join('#'),
    },
    ReturnConsumedCapacity: 'INDEXES',
    ReturnItemCollectionMetrics: 'SIZE',
    ReturnValues: 'ALL_NEW',
    TableName: tableName,
    UpdateExpression: ue,
  };

  try {
    const {
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
      Attributes: item,
    } = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, 'Expected DynamoDB ot return an Attributes prop.');
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
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export type DeleteMetricOutput = ResultType<void>;

/**  */
export async function deleteMetric(
  input: MetricPrimaryKey
): Promise<DeleteMetricOutput> {
  unpackTableNames();
  const tableName = process.env.TABLE_METRIC;
  assert(tableName, 'TABLE_METRIC is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['METRIC'].join('#'),
        sk: ['SUMMARY', input.onFreeTrial].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'NONE',
      TableName: tableName,
    };

    const {ConsumedCapacity: capacity, ItemCollectionMetrics: metrics} =
      await ddbDocClient.send(new DeleteCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    return {
      capacity,
      item: undefined,
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new NotFoundError('Metric', input);
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
  unpackTableNames();
  const tableName = process.env.TABLE_METRIC;
  assert(tableName, 'TABLE_METRIC is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: true,
    Key: {
      pk: ['METRIC'].join('#'),
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
          `Expected ${JSON.stringify(input)} to load a Metric but loaded ${item._et} instead`
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

export type UpdateMetricInput = Omit<Metric, 'createdAt' | 'id' | 'updatedAt'>;
export type UpdateMetricOutput = ResultType<Metric>;

/**  */
export async function updateMetric(
  input: Readonly<UpdateMetricInput>
): Promise<Readonly<UpdateMetricOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_METRIC;
  assert(tableName, 'TABLE_METRIC is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallMetric(input);
  try {
    let previousVersionCE = '';
    let previousVersionEAV = {};
    if ('version' in input && typeof input.version !== 'undefined') {
      previousVersionCE = '#version = :previousVersion AND ';
      previousVersionEAV = {':previousVersion': input.version};
    }
    const commandInput: UpdateCommandInput = {
      ConditionExpression: `${previousVersionCE}#entity = :entity AND attribute_exists(#pk)`,
      ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ...previousVersionEAV,
      },
      Key: {
        pk: ['METRIC'].join('#'),
        sk: ['SUMMARY', input.onFreeTrial].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression,
    };

    const {
      Attributes: item,
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
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
          `Expected ${JSON.stringify({onFreeTrial: input.onFreeTrial})} to update a Metric but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallMetric(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readMetric(input);
      } catch {
        throw new NotFoundError('Metric', {onFreeTrial: input.onFreeTrial});
      }
      throw new OptimisticLockingError('Metric', {
        onFreeTrial: input.onFreeTrial,
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

export type QueryMetricInput = {} | {onFreeTrial: Scalars['Boolean']['input']};
export type QueryMetricOutput = MultiResultType<Metric>;

function makeEanForQueryMetric(
  input: QueryMetricInput
): Record<string, string> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

function makeEavForQueryMetric(input: QueryMetricInput): Record<string, any> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['METRIC'].join('#'),
      ':sk': makeSortKeyForQuery('SUMMARY', ['onFreeTrial'], input),
    };
  }
}

function makeKceForQueryMetric(
  input: QueryMetricInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${operator === 'begins_with' ? 'begins_with(#sk, :sk)' : `#sk ${operator} :sk`}`;
  }
}

/** queryMetric */
export async function queryMetric(
  input: Readonly<QueryMetricInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryMetricOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_METRIC;
  assert(tableName, 'TABLE_METRIC is not set');

  const ExpressionAttributeNames = makeEanForQueryMetric(input);
  const ExpressionAttributeValues = makeEavForQueryMetric(input);
  const KeyConditionExpression = makeKceForQueryMetric(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: !('index' in input),
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ExclusiveStartKey: nextToken,
    IndexName: undefined,
    KeyConditionExpression,
    Limit: limit,
    ReturnConsumedCapacity: 'INDEXES',
    ScanIndexForward: !reverse,
    TableName: tableName,
  };

  try {
    const {
      ConsumedCapacity: capacity,
      Items: items = [],
      LastEvaluatedKey: lastEvaluatedKey,
    } = await ddbDocClient.send(new QueryCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    return {
      capacity,
      hasNextPage: !!lastEvaluatedKey,
      items: items.map((item) => {
        assert(
          item._et === 'Metric',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only Metric was expected.`
            )
        );
        return unmarshallMetric(item);
      }),
      nextToken: lastEvaluatedKey,
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

/** queries the Metric table by primary key using a node id */
export async function queryMetricByNodeId(
  id: Scalars['ID']['input']
): Promise<Readonly<Omit<ResultType<Metric>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryMetricInput = {};

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.onFreeTrial = Boolean(primaryKeyValues[3]);
  }

  const {capacity, items} = await queryMetric(primaryKey);

  assert(items.length > 0, () => new NotFoundError('Metric', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple Metric with id ${id}`)
  );

  return {capacity, item: items[0]};
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

export type PlanMetricPrimaryKey = Pick<
  PlanMetric,
  'cancelled' | 'onFreeTrial' | 'planName'
>;

export type CreatePlanMetricInput = Omit<
  PlanMetric,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreatePlanMetricOutput = ResultType<PlanMetric>;
/**  */
export async function createPlanMetric(
  input: Readonly<CreatePlanMetricInput>
): Promise<Readonly<CreatePlanMetricOutput>> {
  unpackTableNames();
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
        pk: ['PLAN_METRIC'].join('#'),
        sk: ['PLAN', input.cancelled, input.onFreeTrial, input.planName].join(
          '#'
        ),
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
        pk: ['PLAN_METRIC'].join('#'),
        sk: ['PLAN', input.cancelled, input.onFreeTrial, input.planName].join(
          '#'
        ),
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

export type BlindWritePlanMetricInput = Omit<
  PlanMetric,
  'createdAt' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<PlanMetric, 'createdAt'>>;

export type BlindWritePlanMetricOutput = ResultType<PlanMetric>;
/** */
export async function blindWritePlanMetric(
  input: Readonly<BlindWritePlanMetricInput>
): Promise<Readonly<BlindWritePlanMetricOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_PLAN_METRIC;
  assert(tableName, 'TABLE_PLAN_METRIC is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallPlanMetric(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['PLAN_METRIC'].join('#'),
      sk: ['PLAN', input.cancelled, input.onFreeTrial, input.planName].join(
        '#'
      ),
    },
    ReturnConsumedCapacity: 'INDEXES',
    ReturnItemCollectionMetrics: 'SIZE',
    ReturnValues: 'ALL_NEW',
    TableName: tableName,
    UpdateExpression: ue,
  };

  try {
    const {
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
      Attributes: item,
    } = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    assert(item, 'Expected DynamoDB ot return an Attributes prop.');
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
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  }
}

export type DeletePlanMetricOutput = ResultType<void>;

/**  */
export async function deletePlanMetric(
  input: PlanMetricPrimaryKey
): Promise<DeletePlanMetricOutput> {
  unpackTableNames();
  const tableName = process.env.TABLE_PLAN_METRIC;
  assert(tableName, 'TABLE_PLAN_METRIC is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['PLAN_METRIC'].join('#'),
        sk: ['PLAN', input.cancelled, input.onFreeTrial, input.planName].join(
          '#'
        ),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'NONE',
      TableName: tableName,
    };

    const {ConsumedCapacity: capacity, ItemCollectionMetrics: metrics} =
      await ddbDocClient.send(new DeleteCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    return {
      capacity,
      item: undefined,
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new NotFoundError('PlanMetric', input);
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
  unpackTableNames();
  const tableName = process.env.TABLE_PLAN_METRIC;
  assert(tableName, 'TABLE_PLAN_METRIC is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: true,
    Key: {
      pk: ['PLAN_METRIC'].join('#'),
      sk: ['PLAN', input.cancelled, input.onFreeTrial, input.planName].join(
        '#'
      ),
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
          `Expected ${JSON.stringify(input)} to load a PlanMetric but loaded ${item._et} instead`
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

export type UpdatePlanMetricInput = Omit<
  PlanMetric,
  'createdAt' | 'id' | 'updatedAt'
>;
export type UpdatePlanMetricOutput = ResultType<PlanMetric>;

/**  */
export async function updatePlanMetric(
  input: Readonly<UpdatePlanMetricInput>
): Promise<Readonly<UpdatePlanMetricOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_PLAN_METRIC;
  assert(tableName, 'TABLE_PLAN_METRIC is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallPlanMetric(input);
  try {
    let previousVersionCE = '';
    let previousVersionEAV = {};
    if ('version' in input && typeof input.version !== 'undefined') {
      previousVersionCE = '#version = :previousVersion AND ';
      previousVersionEAV = {':previousVersion': input.version};
    }
    const commandInput: UpdateCommandInput = {
      ConditionExpression: `${previousVersionCE}#entity = :entity AND attribute_exists(#pk)`,
      ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ...previousVersionEAV,
      },
      Key: {
        pk: ['PLAN_METRIC'].join('#'),
        sk: ['PLAN', input.cancelled, input.onFreeTrial, input.planName].join(
          '#'
        ),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression,
    };

    const {
      Attributes: item,
      ConsumedCapacity: capacity,
      ItemCollectionMetrics: metrics,
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
          `Expected ${JSON.stringify({cancelled: input.cancelled, onFreeTrial: input.onFreeTrial, planName: input.planName})} to update a PlanMetric but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallPlanMetric(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readPlanMetric(input);
      } catch {
        throw new NotFoundError('PlanMetric', {
          cancelled: input.cancelled,
          onFreeTrial: input.onFreeTrial,
          planName: input.planName,
        });
      }
      throw new OptimisticLockingError('PlanMetric', {
        cancelled: input.cancelled,
        onFreeTrial: input.onFreeTrial,
        planName: input.planName,
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

export type QueryPlanMetricInput =
  | {}
  | {cancelled: Scalars['Boolean']['input']}
  | {
      cancelled: Scalars['Boolean']['input'];
      onFreeTrial: Scalars['Boolean']['input'];
    }
  | {
      cancelled: Scalars['Boolean']['input'];
      onFreeTrial: Scalars['Boolean']['input'];
      planName?: Maybe<Scalars['String']['input']>;
    };
export type QueryPlanMetricOutput = MultiResultType<PlanMetric>;

function makeEanForQueryPlanMetric(
  input: QueryPlanMetricInput
): Record<string, string> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

function makeEavForQueryPlanMetric(
  input: QueryPlanMetricInput
): Record<string, any> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['PLAN_METRIC'].join('#'),
      ':sk': makeSortKeyForQuery(
        'PLAN',
        ['cancelled', 'onFreeTrial', 'planName'],
        input
      ),
    };
  }
}

function makeKceForQueryPlanMetric(
  input: QueryPlanMetricInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${operator === 'begins_with' ? 'begins_with(#sk, :sk)' : `#sk ${operator} :sk`}`;
  }
}

/** queryPlanMetric */
export async function queryPlanMetric(
  input: Readonly<QueryPlanMetricInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryPlanMetricOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_PLAN_METRIC;
  assert(tableName, 'TABLE_PLAN_METRIC is not set');

  const ExpressionAttributeNames = makeEanForQueryPlanMetric(input);
  const ExpressionAttributeValues = makeEavForQueryPlanMetric(input);
  const KeyConditionExpression = makeKceForQueryPlanMetric(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: !('index' in input),
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ExclusiveStartKey: nextToken,
    IndexName: undefined,
    KeyConditionExpression,
    Limit: limit,
    ReturnConsumedCapacity: 'INDEXES',
    ScanIndexForward: !reverse,
    TableName: tableName,
  };

  try {
    const {
      ConsumedCapacity: capacity,
      Items: items = [],
      LastEvaluatedKey: lastEvaluatedKey,
    } = await ddbDocClient.send(new QueryCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    return {
      capacity,
      hasNextPage: !!lastEvaluatedKey,
      items: items.map((item) => {
        assert(
          item._et === 'PlanMetric',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only PlanMetric was expected.`
            )
        );
        return unmarshallPlanMetric(item);
      }),
      nextToken: lastEvaluatedKey,
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

/** queries the PlanMetric table by primary key using a node id */
export async function queryPlanMetricByNodeId(
  id: Scalars['ID']['input']
): Promise<Readonly<Omit<ResultType<PlanMetric>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryPlanMetricInput = {};

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.cancelled = Boolean(primaryKeyValues[3]);
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.onFreeTrial = Boolean(primaryKeyValues[4]);
  }

  if (typeof primaryKeyValues[4] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.planName = primaryKeyValues[5];
  }

  const {capacity, items} = await queryPlanMetric(primaryKey);

  assert(items.length > 0, () => new NotFoundError('PlanMetric', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple PlanMetric with id ${id}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallPlanMetricOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallPlanMetricInput = Required<
  Pick<
    PlanMetric,
    'cancelled' | 'count' | 'monthlyRecurringRevenueInCents' | 'onFreeTrial'
  >
> &
  Partial<Pick<PlanMetric, 'planName' | 'version'>>;

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
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'PlanMetric',
    ':cancelled': input.cancelled,
    ':count': input.count,
    ':monthlyRecurringRevenueInCents': input.monthlyRecurringRevenueInCents,
    ':onFreeTrial': input.onFreeTrial,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

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

/** Unmarshalls a DynamoDB record into a PlanMetric object */
export function unmarshallPlanMetric(item: Record<string, any>): PlanMetric {
  let result: PlanMetric = {
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
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

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

export type SubscriptionEventPrimaryKey = Pick<
  SubscriptionEvent,
  'effectiveDate' | 'externalId'
>;

export type CreateSubscriptionEventInput = Omit<
  SubscriptionEvent,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreateSubscriptionEventOutput = ResultType<SubscriptionEvent>;
/**  */
export async function createSubscriptionEvent(
  input: Readonly<CreateSubscriptionEventInput>
): Promise<Readonly<CreateSubscriptionEventOutput>> {
  unpackTableNames();
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
  unpackTableNames();
  const tableName = process.env.TABLE_SUBSCRIPTION_EVENT;
  assert(tableName, 'TABLE_SUBSCRIPTION_EVENT is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: true,
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
          `Expected ${JSON.stringify(input)} to load a SubscriptionEvent but loaded ${item._et} instead`
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

export type QuerySubscriptionEventInput =
  | {externalId: Scalars['String']['input']}
  | {
      effectiveDate: Scalars['Date']['input'];
      externalId: Scalars['String']['input'];
    };
export type QuerySubscriptionEventOutput = MultiResultType<SubscriptionEvent>;

function makeEanForQuerySubscriptionEvent(
  input: QuerySubscriptionEventInput
): Record<string, string> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

function makeEavForQuerySubscriptionEvent(
  input: QuerySubscriptionEventInput
): Record<string, any> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.externalId].join('#'),
      ':sk': makeSortKeyForQuery(
        'SUBSCRIPTION_EVENT',
        ['effectiveDate'],
        input
      ),
    };
  }
}

function makeKceForQuerySubscriptionEvent(
  input: QuerySubscriptionEventInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${operator === 'begins_with' ? 'begins_with(#sk, :sk)' : `#sk ${operator} :sk`}`;
  }
}

/** querySubscriptionEvent */
export async function querySubscriptionEvent(
  input: Readonly<QuerySubscriptionEventInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QuerySubscriptionEventOutput>> {
  unpackTableNames();
  const tableName = process.env.TABLE_SUBSCRIPTION_EVENT;
  assert(tableName, 'TABLE_SUBSCRIPTION_EVENT is not set');

  const ExpressionAttributeNames = makeEanForQuerySubscriptionEvent(input);
  const ExpressionAttributeValues = makeEavForQuerySubscriptionEvent(input);
  const KeyConditionExpression = makeKceForQuerySubscriptionEvent(input, {
    operator,
  });

  const commandInput: QueryCommandInput = {
    ConsistentRead: !('index' in input),
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ExclusiveStartKey: nextToken,
    IndexName: undefined,
    KeyConditionExpression,
    Limit: limit,
    ReturnConsumedCapacity: 'INDEXES',
    ScanIndexForward: !reverse,
    TableName: tableName,
  };

  try {
    const {
      ConsumedCapacity: capacity,
      Items: items = [],
      LastEvaluatedKey: lastEvaluatedKey,
    } = await ddbDocClient.send(new QueryCommand(commandInput));

    assert(
      capacity,
      'Expected ConsumedCapacity to be returned. This is a bug in codegen.'
    );

    return {
      capacity,
      hasNextPage: !!lastEvaluatedKey,
      items: items.map((item) => {
        assert(
          item._et === 'SubscriptionEvent',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only SubscriptionEvent was expected.`
            )
        );
        return unmarshallSubscriptionEvent(item);
      }),
      nextToken: lastEvaluatedKey,
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

/** queries the SubscriptionEvent table by primary key using a node id */
export async function querySubscriptionEventByNodeId(
  id: Scalars['ID']['input']
): Promise<Readonly<Omit<ResultType<SubscriptionEvent>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QuerySubscriptionEventInput = {
    externalId: primaryKeyValues[1],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.effectiveDate = new Date(primaryKeyValues[4]);
  }

  const {capacity, items} = await querySubscriptionEvent(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('SubscriptionEvent', primaryKey)
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(`Found multiple SubscriptionEvent with id ${id}`)
  );

  return {capacity, item: items[0]};
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
  >
> &
  Partial<Pick<SubscriptionEvent, 'planName' | 'version'>>;

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
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

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

/** Unmarshalls a DynamoDB record into a SubscriptionEvent object */
export function unmarshallSubscriptionEvent(
  item: Record<string, any>
): SubscriptionEvent {
  let result: SubscriptionEvent = {
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
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

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
