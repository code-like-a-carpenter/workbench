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

export type CreateAccountInput = Omit<
  Account,
  | 'cancelled'
  | 'createdAt'
  | 'createdAt'
  | 'effectiveDate'
  | 'externalId'
  | 'hasEverSubscribed'
  | 'id'
  | 'id'
  | 'indexedPlanName'
  | 'lastPlanName'
  | 'monthlyPriceInCents'
  | 'onFreeTrial'
  | 'planName'
  | 'updatedAt'
  | 'updatedAt'
  | 'version'
  | 'version'
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

export type CreateMetricInput = Omit<
  Metric,
  | 'count'
  | 'createdAt'
  | 'createdAt'
  | 'id'
  | 'id'
  | 'monthlyRecurringRevenueInCents'
  | 'onFreeTrial'
  | 'updatedAt'
  | 'updatedAt'
  | 'version'
  | 'version'
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

export type CreatePlanMetricInput = Omit<
  PlanMetric,
  | 'cancelled'
  | 'count'
  | 'createdAt'
  | 'createdAt'
  | 'id'
  | 'id'
  | 'monthlyRecurringRevenueInCents'
  | 'onFreeTrial'
  | 'planName'
  | 'updatedAt'
  | 'updatedAt'
  | 'version'
  | 'version'
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

export type CreateSubscriptionEventInput = Omit<
  SubscriptionEvent,
  | 'cancelled'
  | 'createdAt'
  | 'createdAt'
  | 'effectiveDate'
  | 'externalId'
  | 'id'
  | 'id'
  | 'monthlyPriceInCents'
  | 'onFreeTrial'
  | 'planName'
  | 'updatedAt'
  | 'updatedAt'
  | 'version'
  | 'version'
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
