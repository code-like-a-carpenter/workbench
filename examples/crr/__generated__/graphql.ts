import {
  ConditionalCheckFailedException,
  ConsumedCapacity,
  ItemCollectionMetrics,
} from '@aws-sdk/client-dynamodb';
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
import {ServiceException} from '@aws-sdk/smithy-client';
import type {NativeAttributeValue} from '@aws-sdk/util-dynamodb';
import type {MultiResultType, ResultType, QueryOptions} from '@ianwremmel/data';
import {
  assert,
  makeSortKeyForQuery,
  unmarshallRequiredField,
  unmarshallOptionalField,
  AlreadyExistsError,
  AssertionError,
  BaseDataLibraryError,
  DataIntegrityError,
  NotFoundError,
  OptimisticLockingError,
  UnexpectedAwsError,
  UnexpectedError,
} from '@ianwremmel/data';
import Base64 from 'base64url';

import {
  computeAccountGithubEventActionSort,
  computeAccountIndexPlanName,
  computeAccountIndexPlanId,
  computeGithubEventAccountId,
  computeGithubEventAction,
  computeGithubEventInstallationId,
  computeGithubEventSenderId,
  computeSubscriptionGithubEventActionSort,
} from '@check-run-reporter/computed-fields';
import {
  ddbDocClient,
  idGenerator,
} from '@check-run-reporter/schema-dependencies';
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
  /** JavaScript Date stored as a Number in DynamoDB */
  Date: Date;
  /** Arbitrary JSON stored as a Map in DynamoDB */
  JSONObject: Record<string, unknown>;
}

/** Keeps track of each installation known for an account */
export type Account = Model &
  PublicModel &
  SubmissionSummary &
  Timestamped &
  Versioned & {
    __typename?: 'Account';
    billingCycle?: Maybe<BillingCycle>;
    billingEmail?: Maybe<Scalars['String']>;
    cancelled?: Maybe<Scalars['Boolean']>;
    count?: Maybe<Scalars['Int']>;
    countThisMonth?: Maybe<Scalars['Int']>;
    createdAt: Scalars['Date'];
    effectiveDate?: Maybe<Scalars['Date']>;
    email?: Maybe<Scalars['String']>;
    externalId: Scalars['String'];
    externalInstallationId?: Maybe<Scalars['String']>;
    fileCount?: Maybe<Scalars['Int']>;
    fileCountThisMonth?: Maybe<Scalars['Int']>;
    freeTrialEndsOn?: Maybe<Scalars['Date']>;
    githubAppAuthorizationRevokedOn?: Maybe<Scalars['Date']>;
    githubEventAction?: Maybe<Scalars['String']>;
    githubEventActionSort: Scalars['String'];
    hasEverSubscribed?: Maybe<Scalars['Boolean']>;
    htmlUrl?: Maybe<Scalars['String']>;
    id: Scalars['ID'];
    indexedPlanId?: Maybe<Scalars['String']>;
    indexedPlanName?: Maybe<Scalars['String']>;
    lastPlanId?: Maybe<Scalars['String']>;
    lastPlanName?: Maybe<Scalars['String']>;
    lastSeenUserAgent?: Maybe<Scalars['String']>;
    lastSubmissionDate?: Maybe<Scalars['Date']>;
    login?: Maybe<Scalars['String']>;
    monthlyPriceInCents?: Maybe<Scalars['Int']>;
    nextBillingDate?: Maybe<Scalars['Date']>;
    onFreeTrial?: Maybe<Scalars['Boolean']>;
    planId?: Maybe<Scalars['String']>;
    planName?: Maybe<Scalars['String']>;
    publicId: Scalars['String'];
    size?: Maybe<Scalars['Int']>;
    sizeThisMonth?: Maybe<Scalars['Int']>;
    subscriptionCount?: Maybe<Scalars['Int']>;
    subscriptionStatusEventId?: Maybe<Scalars['String']>;
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
    yearlyPriceInCents?: Maybe<Scalars['Int']>;
  };

/** Keeps track of each email known for an account */
export type AccountEmail = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'AccountEmail';
    createdAt: Scalars['Date'];
    email: Scalars['String'];
    externalId: Scalars['String'];
    id: Scalars['ID'];
    publicId: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Keeps track of each installation known for an account */
export type AccountInstallation = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'AccountInstallation';
    createdAt: Scalars['Date'];
    externalId: Scalars['String'];
    externalInstallationId: Scalars['String'];
    id: Scalars['ID'];
    publicId: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Keeps track of each login known for an account */
export type AccountLogin = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'AccountLogin';
    createdAt: Scalars['Date'];
    externalId: Scalars['String'];
    id: Scalars['ID'];
    login: Scalars['String'];
    publicId: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Billing cycle */
export type BillingCycle = 'monthly' | 'yearly';

/** Business metric for a specific plan */
export type BusinessMetric = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'BusinessMetric';
    arrInCents: Scalars['Int'];
    arrInCentsIncludingMonthly: Scalars['Int'];
    count: Scalars['Int'];
    createdAt: Scalars['Date'];
    id: Scalars['ID'];
    mrrInCents: Scalars['Int'];
    mrrInCentsIncludingYearly: Scalars['Int'];
    onFreeTrial: Scalars['Boolean'];
    planName: Scalars['String'];
    publicId: Scalars['String'];
    updatedAt: Scalars['Date'];
    version: Scalars['Int'];
  };

/** Summarizes business metrics */
export type BusinessMetricSummary = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'BusinessMetricSummary';
    arrInCents: Scalars['Int'];
    arrInCentsIncludingMonthly: Scalars['Int'];
    count: Scalars['Int'];
    createdAt: Scalars['Date'];
    id: Scalars['ID'];
    mrrInCents: Scalars['Int'];
    mrrInCentsIncludingYearly: Scalars['Int'];
    onFreeTrial: Scalars['Boolean'];
    publicId: Scalars['String'];
    updatedAt: Scalars['Date'];
    version: Scalars['Int'];
  };

/** Describes the result of a specific Case execution. */
export type CaseInstance = Model &
  Timestamped &
  Versioned & {
    __typename?: 'CaseInstance';
    branchName: Scalars['String'];
    conclusion: Scalars['String'];
    createdAt: Scalars['Date'];
    duration?: Maybe<Scalars['Float']>;
    filename?: Maybe<Scalars['String']>;
    id: Scalars['ID'];
    label?: Maybe<Scalars['String']>;
    lineage: Scalars['String'];
    repoId: Scalars['String'];
    retry: Scalars['Int'];
    sha: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Describes the aggregate state of a Case. */
export type CaseSummary = Model &
  Timestamped &
  Versioned & {
    __typename?: 'CaseSummary';
    branchName: Scalars['String'];
    createdAt: Scalars['Date'];
    duration: Scalars['Float'];
    id: Scalars['ID'];
    label?: Maybe<Scalars['String']>;
    lineage: Scalars['String'];
    repoId: Scalars['String'];
    stability: Scalars['Float'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** CDC Event Types */
export type CdcEvent = 'INSERT' | 'MODIFY' | 'REMOVE' | 'UPSERT';

/**
 * Represents a mutex lock for a CheckSuite. While this record exists, other
 * background processes may not interact with the corresponding CheckSuite.
 */
export type CheckSuiteLock = Model &
  Timestamped &
  Versioned & {
    __typename?: 'CheckSuiteLock';
    createdAt: Scalars['Date'];
    id: Scalars['ID'];
    label?: Maybe<Scalars['String']>;
    repoId: Scalars['String'];
    sha: Scalars['String'];
    updatedAt: Scalars['Date'];
    version: Scalars['Int'];
  };

/** Possible case types for converting a fieldName to a DynamoDB column_name. */
export type ColumnCase = 'CAMEL_CASE' | 'SNAKE_CASE';

/** Configuration specific to a table dispatcher */
export interface DispatcherConfig {
  lambdaConfig?: InputMaybe<LambdaConfig>;
}

/** Types of email templates */
export type EmailTemplate = 'Cancellation' | 'Nudge' | 'Welcome';

/** Describes the stability and duration of each submitted file */
export type FileTiming = Model &
  Timestamped &
  Versioned & {
    __typename?: 'FileTiming';
    branchName: Scalars['String'];
    createdAt: Scalars['Date'];
    duration: Scalars['Float'];
    filename: Scalars['String'];
    id: Scalars['ID'];
    label?: Maybe<Scalars['String']>;
    repoId: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Represents an event from a Source Control provider (i.e., GitHub). */
export type GithubEvent = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'GithubEvent';
    accountId: Scalars['String'];
    action?: Maybe<Scalars['String']>;
    createdAt: Scalars['Date'];
    delivery: Scalars['String'];
    event: Scalars['String'];
    id: Scalars['ID'];
    installationId?: Maybe<Scalars['String']>;
    payload: Scalars['JSONObject'];
    publicId: Scalars['String'];
    senderId?: Maybe<Scalars['String']>;
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Configuration specific to a model handler */
export interface HandlerConfig {
  lambdaConfig?: InputMaybe<LambdaConfig>;
}

/** Reusable options for all generated lambdas */
export interface LambdaConfig {
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
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

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
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  publicId: Scalars['String'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/** Not used. Just here to satisfy ESLint. */
export interface Query {
  __typename?: 'Query';
  model?: Maybe<Model>;
}

/** Not used. Just here to satisfy ESLint. */
export interface QueryModelArgs {
  id: Scalars['ID'];
}

/** A Repository */
export type Repository = Model &
  PublicModel &
  SubmissionSummary &
  Timestamped &
  Versioned & {
    __typename?: 'Repository';
    count?: Maybe<Scalars['Int']>;
    countThisMonth?: Maybe<Scalars['Int']>;
    createdAt: Scalars['Date'];
    defaultBranchName?: Maybe<Scalars['String']>;
    externalAccountId: Scalars['String'];
    externalId: Scalars['String'];
    externalInstallationId: Scalars['String'];
    fileCount?: Maybe<Scalars['Int']>;
    fileCountThisMonth?: Maybe<Scalars['Int']>;
    id: Scalars['ID'];
    lastSeenUserAgent?: Maybe<Scalars['String']>;
    lastSubmissionDate?: Maybe<Scalars['Date']>;
    organization: Scalars['String'];
    private?: Maybe<Scalars['Boolean']>;
    publicId: Scalars['String'];
    repository?: Maybe<Scalars['String']>;
    size?: Maybe<Scalars['Int']>;
    sizeThisMonth?: Maybe<Scalars['Int']>;
    token: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** A repository */
export type RepositoryLabel = Model &
  Timestamped &
  Versioned & {
    __typename?: 'RepositoryLabel';
    createdAt: Scalars['Date'];
    duration?: Maybe<Scalars['Float']>;
    externalId: Scalars['String'];
    id: Scalars['ID'];
    label: Scalars['String'];
    stability?: Maybe<Scalars['Float']>;
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** A recording of a single submission, for analytics */
export type RepositorySubmissionEvent = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'RepositorySubmissionEvent';
    createdAt: Scalars['Date'];
    externalAccountId: Scalars['String'];
    externalId: Scalars['String'];
    fileCount: Scalars['Int'];
    id: Scalars['ID'];
    label?: Maybe<Scalars['String']>;
    publicId: Scalars['String'];
    sha: Scalars['String'];
    size: Scalars['Float'];
    updatedAt: Scalars['Date'];
    userAgent?: Maybe<Scalars['String']>;
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** An email to be sent */
export type ScheduledEmail = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'ScheduledEmail';
    createdAt: Scalars['Date'];
    externalId: Scalars['String'];
    id: Scalars['ID'];
    publicId: Scalars['String'];
    template: EmailTemplate;
    ttl?: Maybe<Scalars['Date']>;
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** A record of an email having been sent. */
export type SentEmail = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'SentEmail';
    createdAt: Scalars['Date'];
    externalId: Scalars['String'];
    id: Scalars['ID'];
    messageId: Scalars['String'];
    publicId: Scalars['String'];
    template: EmailTemplate;
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Common fields used summarize submissions for Repos and Accounts */
export interface SubmissionSummary {
  count?: Maybe<Scalars['Int']>;
  countThisMonth?: Maybe<Scalars['Int']>;
  fileCount?: Maybe<Scalars['Int']>;
  fileCountThisMonth?: Maybe<Scalars['Int']>;
  lastSeenUserAgent?: Maybe<Scalars['String']>;
  lastSubmissionDate?: Maybe<Scalars['Date']>;
  size?: Maybe<Scalars['Int']>;
  sizeThisMonth?: Maybe<Scalars['Int']>;
}

/** A change in customer's subscription */
export type Subscription = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'Subscription';
    billingCycle?: Maybe<BillingCycle>;
    cancelled?: Maybe<Scalars['Boolean']>;
    createdAt: Scalars['Date'];
    effectiveDate: Scalars['Date'];
    externalId: Scalars['String'];
    freeTrialEndsOn?: Maybe<Scalars['Date']>;
    githubEventAction?: Maybe<Scalars['String']>;
    githubEventActionSort: Scalars['String'];
    githubEventId?: Maybe<Scalars['String']>;
    id: Scalars['ID'];
    marketplacePurchase?: Maybe<Scalars['JSONObject']>;
    marketplacePurchaseAction?: Maybe<Scalars['String']>;
    monthlyPriceInCents?: Maybe<Scalars['Int']>;
    nextBillingDate?: Maybe<Scalars['Date']>;
    onFreeTrial?: Maybe<Scalars['Boolean']>;
    planId?: Maybe<Scalars['String']>;
    planName?: Maybe<Scalars['String']>;
    publicId: Scalars['String'];
    reason?: Maybe<Scalars['String']>;
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
    yearlyPriceInCents?: Maybe<Scalars['Int']>;
  };

/**
 * Automatically adds a createdAt and updatedAt timestamp to the entity and sets
 * them appropriately. The createdAt timestamp is only set on create, while the
 * updatedAt timestamp is set on create and update.
 */
export interface Timestamped {
  /** Set automatically when the item is first written */
  createdAt: Scalars['Date'];
  /** Set automatically when the item is updated */
  updatedAt: Scalars['Date'];
}

/** A user object */
export type User = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'User';
    avatarUrl?: Maybe<Scalars['String']>;
    createdAt: Scalars['Date'];
    displayName?: Maybe<Scalars['String']>;
    email?: Maybe<Scalars['String']>;
    externalId: Scalars['String'];
    id: Scalars['ID'];
    login?: Maybe<Scalars['String']>;
    publicId: Scalars['String'];
    raw?: Maybe<Scalars['JSONObject']>;
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Keeps track of each email known for a user */
export type UserEmail = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'UserEmail';
    createdAt: Scalars['Date'];
    email: Scalars['String'];
    externalId: Scalars['String'];
    id: Scalars['ID'];
    publicId: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** Keeps track of each login known for a user */
export type UserLogin = Model &
  PublicModel &
  Timestamped &
  Versioned & {
    __typename?: 'UserLogin';
    createdAt: Scalars['Date'];
    externalId: Scalars['String'];
    id: Scalars['ID'];
    login: Scalars['String'];
    publicId: Scalars['String'];
    updatedAt: Scalars['Date'];
    vendor: Vendor;
    version: Scalars['Int'];
  };

/** A user session object. */
export type UserSession = Model &
  Timestamped &
  Versioned & {
    __typename?: 'UserSession';
    createdAt: Scalars['Date'];
    expires: Scalars['Date'];
    id: Scalars['ID'];
    session: Scalars['JSONObject'];
    /**
     * Since `id` is a reserved field, sessionId is the field we'll use to inject a
     * random uuid, which the underlying system will use as the basis for `id`.
     */
    sessionId: Scalars['String'];
    updatedAt: Scalars['Date'];
    version: Scalars['Int'];
  };

/**
 * Support Vendors. Remember to add aliases in .graphqlrc.js to maintain backwards
 * compatibility with pre-graphql tables.
 */
export type Vendor = 'gh';

/**
 * Automatically adds a column to enable optimistic locking. This field shouldn't
 * be manipulated directly, but may need to be passed around by the runtime in
 * order to make updates.
 */
export interface Versioned {
  version: Scalars['Int'];
}

export interface AccountPrimaryKey {
  externalId: Scalars['String'];
  vendor: Vendor;
}

export type CreateAccountInput = Omit<
  Account,
  | 'createdAt'
  | 'githubEventActionSort'
  | 'id'
  | 'indexedPlanId'
  | 'indexedPlanName'
  | 'publicId'
  | 'updatedAt'
  | 'version'
>;
export type CreateAccountOutput = ResultType<Account>;
/**  */
export async function createAccount(
  _input: Readonly<CreateAccountInput>
): Promise<Readonly<CreateAccountOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const now = new Date();

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallAccountInput = {..._input} as MarshallAccountInput;

  let githubEventActionSortComputed = false;
  let githubEventActionSortComputedValue: Account['githubEventActionSort'];
  Object.defineProperty(input, 'githubEventActionSort', {
    enumerable: true,
    /** getter */
    get() {
      if (!githubEventActionSortComputed) {
        githubEventActionSortComputed = true;
        githubEventActionSortComputedValue =
          computeAccountGithubEventActionSort(this);
      }
      return githubEventActionSortComputedValue;
    },
  });

  let indexedPlanIdComputed = false;
  let indexedPlanIdComputedValue: Account['indexedPlanId'];
  Object.defineProperty(input, 'indexedPlanId', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanIdComputed) {
        indexedPlanIdComputed = true;
        indexedPlanIdComputedValue = computeAccountIndexPlanName(this);
      }
      return indexedPlanIdComputedValue;
    },
  });

  let indexedPlanNameComputed = false;
  let indexedPlanNameComputedValue: Account['indexedPlanName'];
  Object.defineProperty(input, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanNameComputed) {
        indexedPlanNameComputed = true;
        indexedPlanNameComputedValue = computeAccountIndexPlanId(this);
      }
      return indexedPlanNameComputedValue;
    },
  });

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccount(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: 'ACCOUNT#0',
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: 'ACCOUNT#0',
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
  | 'createdAt'
  | 'githubEventActionSort'
  | 'id'
  | 'indexedPlanId'
  | 'indexedPlanName'
  | 'publicId'
  | 'updatedAt'
  | 'version'
> &
  Partial<Pick<Account, 'createdAt'>>;

export type BlindWriteAccountOutput = ResultType<Account>;
/** */
export async function blindWriteAccount(
  _input: Readonly<BlindWriteAccountInput>
): Promise<Readonly<BlindWriteAccountOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');
  const now = new Date();

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallAccountInput = {..._input} as MarshallAccountInput;

  let githubEventActionSortComputed = false;
  let githubEventActionSortComputedValue: Account['githubEventActionSort'];
  Object.defineProperty(input, 'githubEventActionSort', {
    enumerable: true,
    /** getter */
    get() {
      if (!githubEventActionSortComputed) {
        githubEventActionSortComputed = true;
        githubEventActionSortComputedValue =
          computeAccountGithubEventActionSort(this);
      }
      return githubEventActionSortComputedValue;
    },
  });

  let indexedPlanIdComputed = false;
  let indexedPlanIdComputedValue: Account['indexedPlanId'];
  Object.defineProperty(input, 'indexedPlanId', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanIdComputed) {
        indexedPlanIdComputed = true;
        indexedPlanIdComputedValue = computeAccountIndexPlanName(this);
      }
      return indexedPlanIdComputedValue;
    },
  });

  let indexedPlanNameComputed = false;
  let indexedPlanNameComputedValue: Account['indexedPlanName'];
  Object.defineProperty(input, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanNameComputed) {
        indexedPlanNameComputed = true;
        indexedPlanNameComputedValue = computeAccountIndexPlanId(this);
      }
      return indexedPlanNameComputedValue;
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
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: 'ACCOUNT#0',
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
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: 'ACCOUNT#0',
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
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: 'ACCOUNT#0',
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

export type UpdateAccountInput = Omit<
  Account,
  | 'createdAt'
  | 'githubEventActionSort'
  | 'id'
  | 'indexedPlanId'
  | 'indexedPlanName'
  | 'publicId'
  | 'updatedAt'
>;
export type UpdateAccountOutput = ResultType<Account>;

/**  */
export async function updateAccount(
  _input: Readonly<UpdateAccountInput>
): Promise<Readonly<UpdateAccountOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallAccountInput = {..._input} as MarshallAccountInput;

  let githubEventActionSortComputed = false;
  let githubEventActionSortComputedValue: Account['githubEventActionSort'];
  Object.defineProperty(input, 'githubEventActionSort', {
    enumerable: true,
    /** getter */
    get() {
      if (!githubEventActionSortComputed) {
        githubEventActionSortComputed = true;
        githubEventActionSortComputedValue =
          computeAccountGithubEventActionSort(this);
      }
      return githubEventActionSortComputedValue;
    },
  });

  let indexedPlanIdComputed = false;
  let indexedPlanIdComputedValue: Account['indexedPlanId'];
  Object.defineProperty(input, 'indexedPlanId', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanIdComputed) {
        indexedPlanIdComputed = true;
        indexedPlanIdComputedValue = computeAccountIndexPlanName(this);
      }
      return indexedPlanIdComputedValue;
    },
  });

  let indexedPlanNameComputed = false;
  let indexedPlanNameComputedValue: Account['indexedPlanName'];
  Object.defineProperty(input, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanNameComputed) {
        indexedPlanNameComputed = true;
        indexedPlanNameComputedValue = computeAccountIndexPlanId(this);
      }
      return indexedPlanNameComputedValue;
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
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: 'ACCOUNT#0',
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
          `Expected ${JSON.stringify({
            externalId: input.externalId,
            vendor: input.vendor,
          })} to update a Account but updated ${item._et} instead`
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
        throw new NotFoundError('Account', {
          externalId: input.externalId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('Account', {
        externalId: input.externalId,
        vendor: input.vendor,
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
  | {externalId: Scalars['String']; vendor: Vendor}
  | {index: 'gsi1'; login?: Maybe<Scalars['String']>; vendor: Vendor}
  | {
      index: 'gsi1';
      externalInstallationId?: Maybe<Scalars['String']>;
      login?: Maybe<Scalars['String']>;
      vendor: Vendor;
    }
  | {index: 'gsi2'; hasEverSubscribed?: Maybe<Scalars['Boolean']>}
  | {
      index: 'gsi2';
      cancelled?: Maybe<Scalars['Boolean']>;
      hasEverSubscribed?: Maybe<Scalars['Boolean']>;
    }
  | {
      index: 'gsi2';
      cancelled?: Maybe<Scalars['Boolean']>;
      hasEverSubscribed?: Maybe<Scalars['Boolean']>;
      indexedPlanName?: Maybe<Scalars['String']>;
    }
  | {
      index: 'gsi2';
      cancelled?: Maybe<Scalars['Boolean']>;
      hasEverSubscribed?: Maybe<Scalars['Boolean']>;
      indexedPlanId?: Maybe<Scalars['String']>;
      indexedPlanName?: Maybe<Scalars['String']>;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryAccountOutput = MultiResultType<Account>;

/** helper */
function makeEanForQueryAccount(
  input: QueryAccountInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'gsi2') {
      return {'#pk': 'gsi2pk', '#sk': 'gsi2sk'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryAccount(input: QueryAccountInput): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['ACCOUNT', input.vendor, input.login].join('#'),
        ':sk': makeSortKeyForQuery(
          'INSTALLATION',
          ['externalInstallationId'],
          input
        ),
      };
    } else if (input.index === 'gsi2') {
      return {
        ':pk': ['PLAN', input.hasEverSubscribed].join('#'),
        ':sk': makeSortKeyForQuery(
          'ACCOUNT',
          ['cancelled', 'indexedPlanName', 'indexedPlanId'],
          input
        ),
      };
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('ACCOUNT', [], input),
    };
  }
}

/** helper */
function makeKceForQueryAccount(
  input: QueryAccountInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'gsi2') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
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
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const ExpressionAttributeNames = makeEanForQueryAccount(input);
  const ExpressionAttributeValues = makeEavForQueryAccount(input);
  const KeyConditionExpression = makeKceForQueryAccount(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<Account>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryAccountInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  const {capacity, items} = await queryAccount(primaryKey);

  assert(items.length > 0, () => new NotFoundError('Account', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple Account with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the Account table by primary key using a node id */
export async function queryAccountByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<Account>, 'metrics'>>> {
  const {capacity, items} = await queryAccount({index: 'publicId', publicId});

  assert(items.length > 0, () => new NotFoundError('Account', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(`Found multiple Account with publicId ${publicId}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallAccountOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallAccountInput = Required<
  Pick<Account, 'externalId' | 'githubEventActionSort' | 'vendor'>
> &
  Partial<
    Pick<
      Account,
      | 'billingCycle'
      | 'billingEmail'
      | 'cancelled'
      | 'count'
      | 'countThisMonth'
      | 'effectiveDate'
      | 'email'
      | 'externalInstallationId'
      | 'fileCount'
      | 'fileCountThisMonth'
      | 'freeTrialEndsOn'
      | 'githubAppAuthorizationRevokedOn'
      | 'githubEventAction'
      | 'hasEverSubscribed'
      | 'htmlUrl'
      | 'indexedPlanId'
      | 'indexedPlanName'
      | 'lastPlanId'
      | 'lastPlanName'
      | 'lastSeenUserAgent'
      | 'lastSubmissionDate'
      | 'login'
      | 'monthlyPriceInCents'
      | 'nextBillingDate'
      | 'onFreeTrial'
      | 'planId'
      | 'planName'
      | 'size'
      | 'sizeThisMonth'
      | 'subscriptionCount'
      | 'subscriptionStatusEventId'
      | 'version'
      | 'yearlyPriceInCents'
    >
  >;

/** Marshalls a DynamoDB record into a Account object */
export function marshallAccount(
  input: MarshallAccountInput,
  now = new Date()
): MarshallAccountOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#githubEventActionSort = :githubEventActionSort',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
    '#gsi2pk = :gsi2pk',
    '#gsi2sk = :gsi2sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'externalId',
    '#githubEventActionSort': 'githubEventActionSort',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
    '#gsi2pk': 'gsi2pk',
    '#gsi2sk': 'gsi2sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'Account',
    ':externalId': input.externalId,
    ':githubEventActionSort': input.githubEventActionSort,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': ['ACCOUNT', input.vendor, input.login].join('#'),
    ':gsi1sk': ['INSTALLATION', input.externalInstallationId].join('#'),
    ':gsi2pk': ['PLAN', input.hasEverSubscribed].join('#'),
    ':gsi2sk': [
      'ACCOUNT',
      input.cancelled,
      input.indexedPlanName,
      input.indexedPlanId,
    ].join('#'),
  };

  if ('billingCycle' in input && typeof input.billingCycle !== 'undefined') {
    ean['#billingCycle'] = 'billingCycle';
    eav[':billingCycle'] = input.billingCycle;
    updateExpression.push('#billingCycle = :billingCycle');
  }

  if ('billingEmail' in input && typeof input.billingEmail !== 'undefined') {
    ean['#billingEmail'] = 'billingEmail';
    eav[':billingEmail'] = input.billingEmail;
    updateExpression.push('#billingEmail = :billingEmail');
  }

  if ('cancelled' in input && typeof input.cancelled !== 'undefined') {
    ean['#cancelled'] = 'cancelled';
    eav[':cancelled'] = input.cancelled;
    updateExpression.push('#cancelled = :cancelled');
  }

  if ('count' in input && typeof input.count !== 'undefined') {
    ean['#count'] = 'count';
    eav[':count'] = input.count;
    updateExpression.push('#count = :count');
  }

  if (
    'countThisMonth' in input &&
    typeof input.countThisMonth !== 'undefined'
  ) {
    ean['#countThisMonth'] = 'countThisMonth';
    eav[':countThisMonth'] = input.countThisMonth;
    updateExpression.push('#countThisMonth = :countThisMonth');
  }

  if ('effectiveDate' in input && typeof input.effectiveDate !== 'undefined') {
    ean['#effectiveDate'] = 'effectiveDate';
    eav[':effectiveDate'] =
      input.effectiveDate === null ? null : input.effectiveDate.toISOString();
    updateExpression.push('#effectiveDate = :effectiveDate');
  }

  if ('email' in input && typeof input.email !== 'undefined') {
    ean['#email'] = 'email';
    eav[':email'] = input.email;
    updateExpression.push('#email = :email');
  }

  if (
    'externalInstallationId' in input &&
    typeof input.externalInstallationId !== 'undefined'
  ) {
    ean['#externalInstallationId'] = 'externalInstallationId';
    eav[':externalInstallationId'] = input.externalInstallationId;
    updateExpression.push('#externalInstallationId = :externalInstallationId');
  }

  if ('fileCount' in input && typeof input.fileCount !== 'undefined') {
    ean['#fileCount'] = 'fileCount';
    eav[':fileCount'] = input.fileCount;
    updateExpression.push('#fileCount = :fileCount');
  }

  if (
    'fileCountThisMonth' in input &&
    typeof input.fileCountThisMonth !== 'undefined'
  ) {
    ean['#fileCountThisMonth'] = 'fileCountThisMonth';
    eav[':fileCountThisMonth'] = input.fileCountThisMonth;
    updateExpression.push('#fileCountThisMonth = :fileCountThisMonth');
  }

  if (
    'freeTrialEndsOn' in input &&
    typeof input.freeTrialEndsOn !== 'undefined'
  ) {
    ean['#freeTrialEndsOn'] = 'freeTrialEndsOn';
    eav[':freeTrialEndsOn'] =
      input.freeTrialEndsOn === null
        ? null
        : input.freeTrialEndsOn.toISOString();
    updateExpression.push('#freeTrialEndsOn = :freeTrialEndsOn');
  }

  if (
    'githubAppAuthorizationRevokedOn' in input &&
    typeof input.githubAppAuthorizationRevokedOn !== 'undefined'
  ) {
    ean['#githubAppAuthorizationRevokedOn'] = 'githubAppAuthorizationRevokedOn';
    eav[':githubAppAuthorizationRevokedOn'] =
      input.githubAppAuthorizationRevokedOn === null
        ? null
        : input.githubAppAuthorizationRevokedOn.toISOString();
    updateExpression.push(
      '#githubAppAuthorizationRevokedOn = :githubAppAuthorizationRevokedOn'
    );
  }

  if (
    'githubEventAction' in input &&
    typeof input.githubEventAction !== 'undefined'
  ) {
    ean['#githubEventAction'] = 'githubEventAction';
    eav[':githubEventAction'] = input.githubEventAction;
    updateExpression.push('#githubEventAction = :githubEventAction');
  }

  if (
    'hasEverSubscribed' in input &&
    typeof input.hasEverSubscribed !== 'undefined'
  ) {
    ean['#hasEverSubscribed'] = 'hasEverSubscribed';
    eav[':hasEverSubscribed'] = input.hasEverSubscribed;
    updateExpression.push('#hasEverSubscribed = :hasEverSubscribed');
  }

  if ('htmlUrl' in input && typeof input.htmlUrl !== 'undefined') {
    ean['#htmlUrl'] = 'htmlUrl';
    eav[':htmlUrl'] = input.htmlUrl;
    updateExpression.push('#htmlUrl = :htmlUrl');
  }

  if ('lastPlanId' in input && typeof input.lastPlanId !== 'undefined') {
    ean['#lastPlanId'] = 'lastPlanId';
    eav[':lastPlanId'] = input.lastPlanId;
    updateExpression.push('#lastPlanId = :lastPlanId');
  }

  if ('lastPlanName' in input && typeof input.lastPlanName !== 'undefined') {
    ean['#lastPlanName'] = 'lastPlanName';
    eav[':lastPlanName'] = input.lastPlanName;
    updateExpression.push('#lastPlanName = :lastPlanName');
  }

  if (
    'lastSeenUserAgent' in input &&
    typeof input.lastSeenUserAgent !== 'undefined'
  ) {
    ean['#lastSeenUserAgent'] = 'lastSeenUserAgent';
    eav[':lastSeenUserAgent'] = input.lastSeenUserAgent;
    updateExpression.push('#lastSeenUserAgent = :lastSeenUserAgent');
  }

  if (
    'lastSubmissionDate' in input &&
    typeof input.lastSubmissionDate !== 'undefined'
  ) {
    ean['#lastSubmissionDate'] = 'lastSubmissionDate';
    eav[':lastSubmissionDate'] =
      input.lastSubmissionDate === null
        ? null
        : input.lastSubmissionDate.toISOString();
    updateExpression.push('#lastSubmissionDate = :lastSubmissionDate');
  }

  if ('login' in input && typeof input.login !== 'undefined') {
    ean['#login'] = 'login';
    eav[':login'] = input.login;
    updateExpression.push('#login = :login');
  }

  if (
    'monthlyPriceInCents' in input &&
    typeof input.monthlyPriceInCents !== 'undefined'
  ) {
    ean['#monthlyPriceInCents'] = 'monthlyPriceInCents';
    eav[':monthlyPriceInCents'] = input.monthlyPriceInCents;
    updateExpression.push('#monthlyPriceInCents = :monthlyPriceInCents');
  }

  if (
    'nextBillingDate' in input &&
    typeof input.nextBillingDate !== 'undefined'
  ) {
    ean['#nextBillingDate'] = 'nextBillingDate';
    eav[':nextBillingDate'] =
      input.nextBillingDate === null
        ? null
        : input.nextBillingDate.toISOString();
    updateExpression.push('#nextBillingDate = :nextBillingDate');
  }

  if ('onFreeTrial' in input && typeof input.onFreeTrial !== 'undefined') {
    ean['#onFreeTrial'] = 'onFreeTrial';
    eav[':onFreeTrial'] = input.onFreeTrial;
    updateExpression.push('#onFreeTrial = :onFreeTrial');
  }

  if ('planId' in input && typeof input.planId !== 'undefined') {
    ean['#planId'] = 'planId';
    eav[':planId'] = input.planId;
    updateExpression.push('#planId = :planId');
  }

  if ('planName' in input && typeof input.planName !== 'undefined') {
    ean['#planName'] = 'planName';
    eav[':planName'] = input.planName;
    updateExpression.push('#planName = :planName');
  }

  if ('size' in input && typeof input.size !== 'undefined') {
    ean['#size'] = 'size';
    eav[':size'] = input.size;
    updateExpression.push('#size = :size');
  }

  if ('sizeThisMonth' in input && typeof input.sizeThisMonth !== 'undefined') {
    ean['#sizeThisMonth'] = 'sizeThisMonth';
    eav[':sizeThisMonth'] = input.sizeThisMonth;
    updateExpression.push('#sizeThisMonth = :sizeThisMonth');
  }

  if (
    'subscriptionCount' in input &&
    typeof input.subscriptionCount !== 'undefined'
  ) {
    ean['#subscriptionCount'] = 'subscriptionCount';
    eav[':subscriptionCount'] = input.subscriptionCount;
    updateExpression.push('#subscriptionCount = :subscriptionCount');
  }

  if (
    'subscriptionStatusEventId' in input &&
    typeof input.subscriptionStatusEventId !== 'undefined'
  ) {
    ean['#subscriptionStatusEventId'] = 'subscriptionStatusEventId';
    eav[':subscriptionStatusEventId'] = input.subscriptionStatusEventId;
    updateExpression.push(
      '#subscriptionStatusEventId = :subscriptionStatusEventId'
    );
  }

  if (
    'yearlyPriceInCents' in input &&
    typeof input.yearlyPriceInCents !== 'undefined'
  ) {
    ean['#yearlyPriceInCents'] = 'yearlyPriceInCents';
    eav[':yearlyPriceInCents'] = input.yearlyPriceInCents;
    updateExpression.push('#yearlyPriceInCents = :yearlyPriceInCents');
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
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    githubEventActionSort: unmarshallRequiredField(
      item,
      'githubEventActionSort',
      ['githubEventActionSort', 'github_event_action_sort']
    ),
    id: Base64.encode(`Account:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('billingCycle' in item || 'billing_cycle' in item) {
    result = {
      ...result,
      billingCycle: unmarshallOptionalField(item, 'billingCycle', [
        'billingCycle',
        'billing_cycle',
      ]),
    };
  }
  if ('billingEmail' in item || 'billing_email' in item) {
    result = {
      ...result,
      billingEmail: unmarshallOptionalField(item, 'billingEmail', [
        'billingEmail',
        'billing_email',
      ]),
    };
  }
  if ('cancelled' in item || 'cancelled' in item) {
    result = {
      ...result,
      cancelled: unmarshallOptionalField(item, 'cancelled', [
        'cancelled',
        'cancelled',
      ]),
    };
  }
  if ('count' in item || 'count' in item) {
    result = {
      ...result,
      count: unmarshallOptionalField(item, 'count', ['count', 'count']),
    };
  }
  if ('countThisMonth' in item || 'count_this_month' in item) {
    result = {
      ...result,
      countThisMonth: unmarshallOptionalField(item, 'countThisMonth', [
        'countThisMonth',
        'count_this_month',
      ]),
    };
  }
  if (
    ('effectiveDate' in item && item.effectiveDate !== null) ||
    ('effective_date' in item && item.effective_date !== null)
  ) {
    result = {
      ...result,
      effectiveDate: unmarshallOptionalField(
        item,
        'effectiveDate',
        ['effectiveDate', 'effective_date'],
        (v) => new Date(v)
      ),
    };
  }
  if ('email' in item || 'email' in item) {
    result = {
      ...result,
      email: unmarshallOptionalField(item, 'email', ['email', 'email']),
    };
  }
  if ('externalInstallationId' in item || 'external_installation_id' in item) {
    result = {
      ...result,
      externalInstallationId: unmarshallOptionalField(
        item,
        'externalInstallationId',
        ['externalInstallationId', 'external_installation_id']
      ),
    };
  }
  if ('fileCount' in item || 'file_count' in item) {
    result = {
      ...result,
      fileCount: unmarshallOptionalField(item, 'fileCount', [
        'fileCount',
        'file_count',
      ]),
    };
  }
  if ('fileCountThisMonth' in item || 'file_count_this_month' in item) {
    result = {
      ...result,
      fileCountThisMonth: unmarshallOptionalField(item, 'fileCountThisMonth', [
        'fileCountThisMonth',
        'file_count_this_month',
      ]),
    };
  }
  if (
    ('freeTrialEndsOn' in item && item.freeTrialEndsOn !== null) ||
    ('free_trial_ends_on' in item && item.free_trial_ends_on !== null)
  ) {
    result = {
      ...result,
      freeTrialEndsOn: unmarshallOptionalField(
        item,
        'freeTrialEndsOn',
        ['freeTrialEndsOn', 'free_trial_ends_on'],
        (v) => new Date(v)
      ),
    };
  }
  if (
    ('githubAppAuthorizationRevokedOn' in item &&
      item.githubAppAuthorizationRevokedOn !== null) ||
    ('github_app_authorization_revoked_on' in item &&
      item.github_app_authorization_revoked_on !== null)
  ) {
    result = {
      ...result,
      githubAppAuthorizationRevokedOn: unmarshallOptionalField(
        item,
        'githubAppAuthorizationRevokedOn',
        [
          'githubAppAuthorizationRevokedOn',
          'github_app_authorization_revoked_on',
        ],
        (v) => new Date(v)
      ),
    };
  }
  if ('githubEventAction' in item || 'github_event_action' in item) {
    result = {
      ...result,
      githubEventAction: unmarshallOptionalField(item, 'githubEventAction', [
        'githubEventAction',
        'github_event_action',
      ]),
    };
  }
  if ('hasEverSubscribed' in item || 'has_ever_subscribed' in item) {
    result = {
      ...result,
      hasEverSubscribed: unmarshallOptionalField(item, 'hasEverSubscribed', [
        'hasEverSubscribed',
        'has_ever_subscribed',
      ]),
    };
  }
  if ('htmlUrl' in item || 'html_url' in item) {
    result = {
      ...result,
      htmlUrl: unmarshallOptionalField(item, 'htmlUrl', [
        'htmlUrl',
        'html_url',
      ]),
    };
  }
  if ('lastPlanId' in item || 'last_plan_id' in item) {
    result = {
      ...result,
      lastPlanId: unmarshallOptionalField(item, 'lastPlanId', [
        'lastPlanId',
        'last_plan_id',
      ]),
    };
  }
  if ('lastPlanName' in item || 'last_plan_name' in item) {
    result = {
      ...result,
      lastPlanName: unmarshallOptionalField(item, 'lastPlanName', [
        'lastPlanName',
        'last_plan_name',
      ]),
    };
  }
  if ('lastSeenUserAgent' in item || 'last_seen_user_agent' in item) {
    result = {
      ...result,
      lastSeenUserAgent: unmarshallOptionalField(item, 'lastSeenUserAgent', [
        'lastSeenUserAgent',
        'last_seen_user_agent',
      ]),
    };
  }
  if (
    ('lastSubmissionDate' in item && item.lastSubmissionDate !== null) ||
    ('last_submission_date' in item && item.last_submission_date !== null)
  ) {
    result = {
      ...result,
      lastSubmissionDate: unmarshallOptionalField(
        item,
        'lastSubmissionDate',
        ['lastSubmissionDate', 'last_submission_date'],
        (v) => new Date(v)
      ),
    };
  }
  if ('login' in item || 'login' in item) {
    result = {
      ...result,
      login: unmarshallOptionalField(item, 'login', ['login', 'login']),
    };
  }
  if ('monthlyPriceInCents' in item || 'monthly_price_in_cents' in item) {
    result = {
      ...result,
      monthlyPriceInCents: unmarshallOptionalField(
        item,
        'monthlyPriceInCents',
        ['monthlyPriceInCents', 'monthly_price_in_cents']
      ),
    };
  }
  if (
    ('nextBillingDate' in item && item.nextBillingDate !== null) ||
    ('next_billing_date' in item && item.next_billing_date !== null)
  ) {
    result = {
      ...result,
      nextBillingDate: unmarshallOptionalField(
        item,
        'nextBillingDate',
        ['nextBillingDate', 'next_billing_date'],
        (v) => new Date(v)
      ),
    };
  }
  if ('onFreeTrial' in item || 'on_free_trial' in item) {
    result = {
      ...result,
      onFreeTrial: unmarshallOptionalField(item, 'onFreeTrial', [
        'onFreeTrial',
        'on_free_trial',
      ]),
    };
  }
  if ('planId' in item || 'plan_id' in item) {
    result = {
      ...result,
      planId: unmarshallOptionalField(item, 'planId', ['planId', 'plan_id']),
    };
  }
  if ('planName' in item || 'plan_name' in item) {
    result = {
      ...result,
      planName: unmarshallOptionalField(item, 'planName', [
        'planName',
        'plan_name',
      ]),
    };
  }
  if ('size' in item || 'size' in item) {
    result = {
      ...result,
      size: unmarshallOptionalField(item, 'size', ['size', 'size']),
    };
  }
  if ('sizeThisMonth' in item || 'size_this_month' in item) {
    result = {
      ...result,
      sizeThisMonth: unmarshallOptionalField(item, 'sizeThisMonth', [
        'sizeThisMonth',
        'size_this_month',
      ]),
    };
  }
  if ('subscriptionCount' in item || 'subscription_count' in item) {
    result = {
      ...result,
      subscriptionCount: unmarshallOptionalField(item, 'subscriptionCount', [
        'subscriptionCount',
        'subscription_count',
      ]),
    };
  }
  if (
    'subscriptionStatusEventId' in item ||
    'subscription_status_event_id' in item
  ) {
    result = {
      ...result,
      subscriptionStatusEventId: unmarshallOptionalField(
        item,
        'subscriptionStatusEventId',
        ['subscriptionStatusEventId', 'subscription_status_event_id']
      ),
    };
  }
  if ('yearlyPriceInCents' in item || 'yearly_price_in_cents' in item) {
    result = {
      ...result,
      yearlyPriceInCents: unmarshallOptionalField(item, 'yearlyPriceInCents', [
        'yearlyPriceInCents',
        'yearly_price_in_cents',
      ]),
    };
  }

  let githubEventActionSortComputed = false;
  const githubEventActionSortDatabaseValue = unmarshallRequiredField(
    item,
    'githubEventActionSort',
    ['githubEventActionSort', 'github_event_action_sort']
  );
  let githubEventActionSortComputedValue: Account['githubEventActionSort'];
  Object.defineProperty(result, 'githubEventActionSort', {
    enumerable: true,
    /** getter */
    get() {
      if (!githubEventActionSortComputed) {
        githubEventActionSortComputed = true;
        if (typeof githubEventActionSortDatabaseValue !== 'undefined') {
          githubEventActionSortComputedValue =
            githubEventActionSortDatabaseValue;
        } else {
          githubEventActionSortComputedValue =
            computeAccountGithubEventActionSort(this);
        }
      }
      return githubEventActionSortComputedValue;
    },
  });

  let indexedPlanIdComputed = false;
  const indexedPlanIdDatabaseValue = unmarshallOptionalField(
    item,
    'indexedPlanId',
    ['indexedPlanId', 'indexed_plan_id']
  );
  let indexedPlanIdComputedValue: Account['indexedPlanId'];
  Object.defineProperty(result, 'indexedPlanId', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanIdComputed) {
        indexedPlanIdComputed = true;
        if (typeof indexedPlanIdDatabaseValue !== 'undefined') {
          indexedPlanIdComputedValue = indexedPlanIdDatabaseValue;
        } else {
          indexedPlanIdComputedValue = computeAccountIndexPlanName(this);
        }
      }
      return indexedPlanIdComputedValue;
    },
  });

  let indexedPlanNameComputed = false;
  const indexedPlanNameDatabaseValue = unmarshallOptionalField(
    item,
    'indexedPlanName',
    ['indexedPlanName', 'indexed_plan_name']
  );
  let indexedPlanNameComputedValue: Account['indexedPlanName'];
  Object.defineProperty(result, 'indexedPlanName', {
    enumerable: true,
    /** getter */
    get() {
      if (!indexedPlanNameComputed) {
        indexedPlanNameComputed = true;
        if (typeof indexedPlanNameDatabaseValue !== 'undefined') {
          indexedPlanNameComputedValue = indexedPlanNameDatabaseValue;
        } else {
          indexedPlanNameComputedValue = computeAccountIndexPlanId(this);
        }
      }
      return indexedPlanNameComputedValue;
    },
  });

  return result;
}

export interface AccountEmailPrimaryKey {
  email: Scalars['String'];
  externalId: Scalars['String'];
  vendor: Vendor;
}

export type CreateAccountEmailInput = Omit<
  AccountEmail,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateAccountEmailOutput = ResultType<AccountEmail>;
/**  */
export async function createAccountEmail(
  input: Readonly<CreateAccountEmailInput>
): Promise<Readonly<CreateAccountEmailOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountEmail(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'AccountEmail',
      () =>
        new DataIntegrityError(
          `Expected to write AccountEmail but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountEmail(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('AccountEmail', {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
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

export type BlindWriteAccountEmailInput = Omit<
  AccountEmail,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<AccountEmail, 'createdAt'>>;

export type BlindWriteAccountEmailOutput = ResultType<AccountEmail>;
/** */
export async function blindWriteAccountEmail(
  input: Readonly<BlindWriteAccountEmailInput>
): Promise<Readonly<BlindWriteAccountEmailOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountEmail(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
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
      item._et === 'AccountEmail',
      () =>
        new DataIntegrityError(
          `Expected to write AccountEmail but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountEmail(item),
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

export type DeleteAccountEmailOutput = ResultType<void>;

/**  */
export async function deleteAccountEmail(
  input: AccountEmailPrimaryKey
): Promise<DeleteAccountEmailOutput> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
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
      throw new NotFoundError('AccountEmail', input);
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

export type ReadAccountEmailOutput = ResultType<AccountEmail>;

/**  */
export async function readAccountEmail(
  input: AccountEmailPrimaryKey
): Promise<Readonly<ReadAccountEmailOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
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

    assert(item, () => new NotFoundError('AccountEmail', input));
    assert(
      item._et === 'AccountEmail',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a AccountEmail but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountEmail(item),
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

export type UpdateAccountEmailInput = Omit<
  AccountEmail,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateAccountEmailOutput = ResultType<AccountEmail>;

/**  */
export async function updateAccountEmail(
  input: Readonly<UpdateAccountEmailInput>
): Promise<Readonly<UpdateAccountEmailOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountEmail(input);
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
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
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
      item._et === 'AccountEmail',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            email: input.email,
            externalId: input.externalId,
            vendor: input.vendor,
          })} to update a AccountEmail but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountEmail(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readAccountEmail(input);
      } catch {
        throw new NotFoundError('AccountEmail', {
          email: input.email,
          externalId: input.externalId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('AccountEmail', {
        email: input.email,
        externalId: input.externalId,
        vendor: input.vendor,
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

export type QueryAccountEmailInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; vendor: Vendor}
  | {email: Scalars['String']; externalId: Scalars['String']; vendor: Vendor}
  | {index: 'gsi1'; email: Scalars['String']; vendor: Vendor}
  | {
      index: 'gsi1';
      email: Scalars['String'];
      updatedAt: Scalars['Date'];
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryAccountEmailOutput = MultiResultType<AccountEmail>;

/** helper */
function makeEanForQueryAccountEmail(
  input: QueryAccountEmailInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryAccountEmail(
  input: QueryAccountEmailInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
        ':sk': makeSortKeyForQuery('ACCOUNT', ['updatedAt'], input),
      };
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('ACCOUNT_EMAIL', ['vendor', 'email'], input),
    };
  }
}

/** helper */
function makeKceForQueryAccountEmail(
  input: QueryAccountEmailInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryAccountEmail */
export async function queryAccountEmail(
  input: Readonly<QueryAccountEmailInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryAccountEmailOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const ExpressionAttributeNames = makeEanForQueryAccountEmail(input);
  const ExpressionAttributeValues = makeEavForQueryAccountEmail(input);
  const KeyConditionExpression = makeKceForQueryAccountEmail(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'AccountEmail',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only AccountEmail was expected.`
            )
        );
        return unmarshallAccountEmail(item);
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

/** queries the AccountEmail table by primary key using a node id */
export async function queryAccountEmailByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<AccountEmail>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryAccountEmailInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.vendor = primaryKeyValues[5] as Vendor;
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.email = primaryKeyValues[6];
  }

  const {capacity, items} = await queryAccountEmail(primaryKey);

  assert(items.length > 0, () => new NotFoundError('AccountEmail', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple AccountEmail with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the AccountEmail table by primary key using a node id */
export async function queryAccountEmailByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<AccountEmail>, 'metrics'>>> {
  const {capacity, items} = await queryAccountEmail({
    index: 'publicId',
    publicId,
  });

  assert(items.length > 0, () => new NotFoundError('AccountEmail', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple AccountEmail with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallAccountEmailOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallAccountEmailInput = Required<
  Pick<AccountEmail, 'email' | 'externalId' | 'vendor'>
> &
  Partial<Pick<AccountEmail, 'version'>>;

/** Marshalls a DynamoDB record into a AccountEmail object */
export function marshallAccountEmail(
  input: MarshallAccountEmailInput,
  now = new Date()
): MarshallAccountEmailOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#email = :email',
    '#externalId = :externalId',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#email': 'email',
    '#externalId': 'externalId',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'AccountEmail',
    ':email': input.email,
    ':externalId': input.externalId,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': ['ACCOUNT_EMAIL', input.vendor, input.email].join('#'),
    ':gsi1sk': ['ACCOUNT', now.getTime()].join('#'),
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a AccountEmail object */
export function unmarshallAccountEmail(
  item: Record<string, any>
): AccountEmail {
  const result: AccountEmail = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    email: unmarshallRequiredField(item, 'email', ['email', 'email']),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    id: Base64.encode(`AccountEmail:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface AccountInstallationPrimaryKey {
  externalId: Scalars['String'];
  externalInstallationId: Scalars['String'];
  vendor: Vendor;
}

export type CreateAccountInstallationInput = Omit<
  AccountInstallation,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateAccountInstallationOutput = ResultType<AccountInstallation>;
/**  */
export async function createAccountInstallation(
  input: Readonly<CreateAccountInstallationInput>
): Promise<Readonly<CreateAccountInstallationOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountInstallation(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: [
          'ACCOUNT_INSTALLATION',
          input.vendor,
          input.externalInstallationId,
        ].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'AccountInstallation',
      () =>
        new DataIntegrityError(
          `Expected to write AccountInstallation but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountInstallation(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('AccountInstallation', {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: [
          'ACCOUNT_INSTALLATION',
          input.vendor,
          input.externalInstallationId,
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

export type BlindWriteAccountInstallationInput = Omit<
  AccountInstallation,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<AccountInstallation, 'createdAt'>>;

export type BlindWriteAccountInstallationOutput =
  ResultType<AccountInstallation>;
/** */
export async function blindWriteAccountInstallation(
  input: Readonly<BlindWriteAccountInstallationInput>
): Promise<Readonly<BlindWriteAccountInstallationOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountInstallation(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: [
        'ACCOUNT_INSTALLATION',
        input.vendor,
        input.externalInstallationId,
      ].join('#'),
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
      item._et === 'AccountInstallation',
      () =>
        new DataIntegrityError(
          `Expected to write AccountInstallation but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountInstallation(item),
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

export type DeleteAccountInstallationOutput = ResultType<void>;

/**  */
export async function deleteAccountInstallation(
  input: AccountInstallationPrimaryKey
): Promise<DeleteAccountInstallationOutput> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: [
          'ACCOUNT_INSTALLATION',
          input.vendor,
          input.externalInstallationId,
        ].join('#'),
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
      throw new NotFoundError('AccountInstallation', input);
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

export type ReadAccountInstallationOutput = ResultType<AccountInstallation>;

/**  */
export async function readAccountInstallation(
  input: AccountInstallationPrimaryKey
): Promise<Readonly<ReadAccountInstallationOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: [
        'ACCOUNT_INSTALLATION',
        input.vendor,
        input.externalInstallationId,
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

    assert(item, () => new NotFoundError('AccountInstallation', input));
    assert(
      item._et === 'AccountInstallation',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a AccountInstallation but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountInstallation(item),
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

export type UpdateAccountInstallationInput = Omit<
  AccountInstallation,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateAccountInstallationOutput = ResultType<AccountInstallation>;

/**  */
export async function updateAccountInstallation(
  input: Readonly<UpdateAccountInstallationInput>
): Promise<Readonly<UpdateAccountInstallationOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountInstallation(input);
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
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: [
          'ACCOUNT_INSTALLATION',
          input.vendor,
          input.externalInstallationId,
        ].join('#'),
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
      item._et === 'AccountInstallation',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            externalId: input.externalId,
            externalInstallationId: input.externalInstallationId,
            vendor: input.vendor,
          })} to update a AccountInstallation but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountInstallation(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readAccountInstallation(input);
      } catch {
        throw new NotFoundError('AccountInstallation', {
          externalId: input.externalId,
          externalInstallationId: input.externalInstallationId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('AccountInstallation', {
        externalId: input.externalId,
        externalInstallationId: input.externalInstallationId,
        vendor: input.vendor,
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

export type QueryAccountInstallationInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; vendor: Vendor}
  | {
      externalId: Scalars['String'];
      externalInstallationId: Scalars['String'];
      vendor: Vendor;
    }
  | {index: 'gsi1'; externalInstallationId: Scalars['String']; vendor: Vendor}
  | {
      index: 'gsi1';
      externalInstallationId: Scalars['String'];
      updatedAt: Scalars['Date'];
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryAccountInstallationOutput =
  MultiResultType<AccountInstallation>;

/** helper */
function makeEanForQueryAccountInstallation(
  input: QueryAccountInstallationInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryAccountInstallation(
  input: QueryAccountInstallationInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': [
          'ACCOUNT_INSTALLATION',
          input.vendor,
          input.externalInstallationId,
        ].join('#'),
        ':sk': makeSortKeyForQuery('ACCOUNT', ['updatedAt'], input),
      };
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery(
        'ACCOUNT_INSTALLATION',
        ['vendor', 'externalInstallationId'],
        input
      ),
    };
  }
}

/** helper */
function makeKceForQueryAccountInstallation(
  input: QueryAccountInstallationInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryAccountInstallation */
export async function queryAccountInstallation(
  input: Readonly<QueryAccountInstallationInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryAccountInstallationOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const ExpressionAttributeNames = makeEanForQueryAccountInstallation(input);
  const ExpressionAttributeValues = makeEavForQueryAccountInstallation(input);
  const KeyConditionExpression = makeKceForQueryAccountInstallation(input, {
    operator,
  });

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'AccountInstallation',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only AccountInstallation was expected.`
            )
        );
        return unmarshallAccountInstallation(item);
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

/** queries the AccountInstallation table by primary key using a node id */
export async function queryAccountInstallationByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<AccountInstallation>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryAccountInstallationInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.vendor = primaryKeyValues[5] as Vendor;
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.externalInstallationId = primaryKeyValues[6];
  }

  const {capacity, items} = await queryAccountInstallation(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('AccountInstallation', primaryKey)
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(`Found multiple AccountInstallation with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the AccountInstallation table by primary key using a node id */
export async function queryAccountInstallationByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<AccountInstallation>, 'metrics'>>> {
  const {capacity, items} = await queryAccountInstallation({
    index: 'publicId',
    publicId,
  });

  assert(
    items.length > 0,
    () => new NotFoundError('AccountInstallation', {publicId})
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple AccountInstallation with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallAccountInstallationOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallAccountInstallationInput = Required<
  Pick<AccountInstallation, 'externalId' | 'externalInstallationId' | 'vendor'>
> &
  Partial<Pick<AccountInstallation, 'version'>>;

/** Marshalls a DynamoDB record into a AccountInstallation object */
export function marshallAccountInstallation(
  input: MarshallAccountInstallationInput,
  now = new Date()
): MarshallAccountInstallationOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#externalInstallationId = :externalInstallationId',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'externalId',
    '#externalInstallationId': 'externalInstallationId',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'AccountInstallation',
    ':externalId': input.externalId,
    ':externalInstallationId': input.externalInstallationId,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': [
      'ACCOUNT_INSTALLATION',
      input.vendor,
      input.externalInstallationId,
    ].join('#'),
    ':gsi1sk': ['ACCOUNT', now.getTime()].join('#'),
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a AccountInstallation object */
export function unmarshallAccountInstallation(
  item: Record<string, any>
): AccountInstallation {
  const result: AccountInstallation = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    externalInstallationId: unmarshallRequiredField(
      item,
      'externalInstallationId',
      ['externalInstallationId', 'external_installation_id']
    ),
    id: Base64.encode(`AccountInstallation:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface AccountLoginPrimaryKey {
  externalId: Scalars['String'];
  login: Scalars['String'];
  vendor: Vendor;
}

export type CreateAccountLoginInput = Omit<
  AccountLogin,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateAccountLoginOutput = ResultType<AccountLogin>;
/**  */
export async function createAccountLogin(
  input: Readonly<CreateAccountLoginInput>
): Promise<Readonly<CreateAccountLoginOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountLogin(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'AccountLogin',
      () =>
        new DataIntegrityError(
          `Expected to write AccountLogin but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountLogin(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('AccountLogin', {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
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

export type BlindWriteAccountLoginInput = Omit<
  AccountLogin,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<AccountLogin, 'createdAt'>>;

export type BlindWriteAccountLoginOutput = ResultType<AccountLogin>;
/** */
export async function blindWriteAccountLogin(
  input: Readonly<BlindWriteAccountLoginInput>
): Promise<Readonly<BlindWriteAccountLoginOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountLogin(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
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
      item._et === 'AccountLogin',
      () =>
        new DataIntegrityError(
          `Expected to write AccountLogin but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountLogin(item),
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

export type DeleteAccountLoginOutput = ResultType<void>;

/**  */
export async function deleteAccountLogin(
  input: AccountLoginPrimaryKey
): Promise<DeleteAccountLoginOutput> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
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
      throw new NotFoundError('AccountLogin', input);
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

export type ReadAccountLoginOutput = ResultType<AccountLogin>;

/**  */
export async function readAccountLogin(
  input: AccountLoginPrimaryKey
): Promise<Readonly<ReadAccountLoginOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
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

    assert(item, () => new NotFoundError('AccountLogin', input));
    assert(
      item._et === 'AccountLogin',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a AccountLogin but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountLogin(item),
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

export type UpdateAccountLoginInput = Omit<
  AccountLogin,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateAccountLoginOutput = ResultType<AccountLogin>;

/**  */
export async function updateAccountLogin(
  input: Readonly<UpdateAccountLoginInput>
): Promise<Readonly<UpdateAccountLoginOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallAccountLogin(input);
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
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
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
      item._et === 'AccountLogin',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            externalId: input.externalId,
            login: input.login,
            vendor: input.vendor,
          })} to update a AccountLogin but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallAccountLogin(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readAccountLogin(input);
      } catch {
        throw new NotFoundError('AccountLogin', {
          externalId: input.externalId,
          login: input.login,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('AccountLogin', {
        externalId: input.externalId,
        login: input.login,
        vendor: input.vendor,
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

export type QueryAccountLoginInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; login: Scalars['String']; vendor: Vendor}
  | {index: 'gsi1'; login: Scalars['String']; vendor: Vendor}
  | {
      index: 'gsi1';
      login: Scalars['String'];
      updatedAt: Scalars['Date'];
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryAccountLoginOutput = MultiResultType<AccountLogin>;

/** helper */
function makeEanForQueryAccountLogin(
  input: QueryAccountLoginInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryAccountLogin(
  input: QueryAccountLoginInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
        ':sk': makeSortKeyForQuery('ACCOUNT', ['updatedAt'], input),
      };
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('ACCOUNT_LOGIN', ['vendor', 'login'], input),
    };
  }
}

/** helper */
function makeKceForQueryAccountLogin(
  input: QueryAccountLoginInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryAccountLogin */
export async function queryAccountLogin(
  input: Readonly<QueryAccountLoginInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryAccountLoginOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const ExpressionAttributeNames = makeEanForQueryAccountLogin(input);
  const ExpressionAttributeValues = makeEavForQueryAccountLogin(input);
  const KeyConditionExpression = makeKceForQueryAccountLogin(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'AccountLogin',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only AccountLogin was expected.`
            )
        );
        return unmarshallAccountLogin(item);
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

/** queries the AccountLogin table by primary key using a node id */
export async function queryAccountLoginByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<AccountLogin>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryAccountLoginInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.vendor = primaryKeyValues[5] as Vendor;
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.login = primaryKeyValues[6];
  }

  const {capacity, items} = await queryAccountLogin(primaryKey);

  assert(items.length > 0, () => new NotFoundError('AccountLogin', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple AccountLogin with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the AccountLogin table by primary key using a node id */
export async function queryAccountLoginByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<AccountLogin>, 'metrics'>>> {
  const {capacity, items} = await queryAccountLogin({
    index: 'publicId',
    publicId,
  });

  assert(items.length > 0, () => new NotFoundError('AccountLogin', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple AccountLogin with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallAccountLoginOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallAccountLoginInput = Required<
  Pick<AccountLogin, 'externalId' | 'login' | 'vendor'>
> &
  Partial<Pick<AccountLogin, 'version'>>;

/** Marshalls a DynamoDB record into a AccountLogin object */
export function marshallAccountLogin(
  input: MarshallAccountLoginInput,
  now = new Date()
): MarshallAccountLoginOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#login = :login',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'externalId',
    '#login': 'login',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'AccountLogin',
    ':externalId': input.externalId,
    ':login': input.login,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': ['ACCOUNT_LOGIN', input.vendor, input.login].join('#'),
    ':gsi1sk': ['ACCOUNT', now.getTime()].join('#'),
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a AccountLogin object */
export function unmarshallAccountLogin(
  item: Record<string, any>
): AccountLogin {
  const result: AccountLogin = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    id: Base64.encode(`AccountLogin:${item.pk}#:#${item.sk}`),
    login: unmarshallRequiredField(item, 'login', ['login', 'login']),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface BusinessMetricPrimaryKey {
  onFreeTrial: Scalars['Boolean'];
  planName: Scalars['String'];
}

export type CreateBusinessMetricInput = Omit<
  BusinessMetric,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateBusinessMetricOutput = ResultType<BusinessMetric>;
/**  */
export async function createBusinessMetric(
  input: Readonly<CreateBusinessMetricInput>
): Promise<Readonly<CreateBusinessMetricOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallBusinessMetric(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
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
        '#publicId = :publicId',
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
      item._et === 'BusinessMetric',
      () =>
        new DataIntegrityError(
          `Expected to write BusinessMetric but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetric(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('BusinessMetric', {
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

export type BlindWriteBusinessMetricInput = Omit<
  BusinessMetric,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<BusinessMetric, 'createdAt'>>;

export type BlindWriteBusinessMetricOutput = ResultType<BusinessMetric>;
/** */
export async function blindWriteBusinessMetric(
  input: Readonly<BlindWriteBusinessMetricInput>
): Promise<Readonly<BlindWriteBusinessMetricOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallBusinessMetric(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['BUSINESS_METRIC'].join('#'),
      sk: ['PLAN', input.onFreeTrial, input.planName].join('#'),
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
      item._et === 'BusinessMetric',
      () =>
        new DataIntegrityError(
          `Expected to write BusinessMetric but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetric(item),
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

export type DeleteBusinessMetricOutput = ResultType<void>;

/**  */
export async function deleteBusinessMetric(
  input: BusinessMetricPrimaryKey
): Promise<DeleteBusinessMetricOutput> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['BUSINESS_METRIC'].join('#'),
        sk: ['PLAN', input.onFreeTrial, input.planName].join('#'),
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
      throw new NotFoundError('BusinessMetric', input);
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

export type ReadBusinessMetricOutput = ResultType<BusinessMetric>;

/**  */
export async function readBusinessMetric(
  input: BusinessMetricPrimaryKey
): Promise<Readonly<ReadBusinessMetricOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

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

    assert(item, () => new NotFoundError('BusinessMetric', input));
    assert(
      item._et === 'BusinessMetric',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a BusinessMetric but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetric(item),
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

export type UpdateBusinessMetricInput = Omit<
  BusinessMetric,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateBusinessMetricOutput = ResultType<BusinessMetric>;

/**  */
export async function updateBusinessMetric(
  input: Readonly<UpdateBusinessMetricInput>
): Promise<Readonly<UpdateBusinessMetricOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallBusinessMetric(input);
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
        pk: ['BUSINESS_METRIC'].join('#'),
        sk: ['PLAN', input.onFreeTrial, input.planName].join('#'),
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
      item._et === 'BusinessMetric',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            onFreeTrial: input.onFreeTrial,
            planName: input.planName,
          })} to update a BusinessMetric but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetric(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readBusinessMetric(input);
      } catch {
        throw new NotFoundError('BusinessMetric', {
          onFreeTrial: input.onFreeTrial,
          planName: input.planName,
        });
      }
      throw new OptimisticLockingError('BusinessMetric', {
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

export type QueryBusinessMetricInput =
  | {}
  | {onFreeTrial: Scalars['Boolean']}
  | {onFreeTrial: Scalars['Boolean']; planName: Scalars['String']}
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryBusinessMetricOutput = MultiResultType<BusinessMetric>;

/** helper */
function makeEanForQueryBusinessMetric(
  input: QueryBusinessMetricInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryBusinessMetric(
  input: QueryBusinessMetricInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['BUSINESS_METRIC'].join('#'),
      ':sk': makeSortKeyForQuery('PLAN', ['onFreeTrial', 'planName'], input),
    };
  }
}

/** helper */
function makeKceForQueryBusinessMetric(
  input: QueryBusinessMetricInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryBusinessMetric */
export async function queryBusinessMetric(
  input: Readonly<QueryBusinessMetricInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryBusinessMetricOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const ExpressionAttributeNames = makeEanForQueryBusinessMetric(input);
  const ExpressionAttributeValues = makeEavForQueryBusinessMetric(input);
  const KeyConditionExpression = makeKceForQueryBusinessMetric(input, {
    operator,
  });

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'BusinessMetric',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only BusinessMetric was expected.`
            )
        );
        return unmarshallBusinessMetric(item);
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

/** queries the BusinessMetric table by primary key using a node id */
export async function queryBusinessMetricByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<BusinessMetric>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryBusinessMetricInput = {};

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.onFreeTrial = Boolean(primaryKeyValues[3]);
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.planName = primaryKeyValues[4];
  }

  const {capacity, items} = await queryBusinessMetric(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('BusinessMetric', primaryKey)
  );
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple BusinessMetric with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the BusinessMetric table by primary key using a node id */
export async function queryBusinessMetricByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<BusinessMetric>, 'metrics'>>> {
  const {capacity, items} = await queryBusinessMetric({
    index: 'publicId',
    publicId,
  });

  assert(
    items.length > 0,
    () => new NotFoundError('BusinessMetric', {publicId})
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple BusinessMetric with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallBusinessMetricOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallBusinessMetricInput = Required<
  Pick<
    BusinessMetric,
    | 'arrInCents'
    | 'arrInCentsIncludingMonthly'
    | 'count'
    | 'mrrInCents'
    | 'mrrInCentsIncludingYearly'
    | 'onFreeTrial'
    | 'planName'
  >
> &
  Partial<Pick<BusinessMetric, 'version'>>;

/** Marshalls a DynamoDB record into a BusinessMetric object */
export function marshallBusinessMetric(
  input: MarshallBusinessMetricInput,
  now = new Date()
): MarshallBusinessMetricOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#arrInCents = :arrInCents',
    '#arrInCentsIncludingMonthly = :arrInCentsIncludingMonthly',
    '#count = :count',
    '#mrrInCents = :mrrInCents',
    '#mrrInCentsIncludingYearly = :mrrInCentsIncludingYearly',
    '#onFreeTrial = :onFreeTrial',
    '#planName = :planName',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#arrInCents': 'arrInCents',
    '#arrInCentsIncludingMonthly': 'arrInCentsIncludingMonthly',
    '#count': 'count',
    '#mrrInCents': 'mrrInCents',
    '#mrrInCentsIncludingYearly': 'mrrInCentsIncludingYearly',
    '#onFreeTrial': 'onFreeTrial',
    '#planName': 'planName',
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'BusinessMetric',
    ':arrInCents': input.arrInCents,
    ':arrInCentsIncludingMonthly': input.arrInCentsIncludingMonthly,
    ':count': input.count,
    ':mrrInCents': input.mrrInCents,
    ':mrrInCentsIncludingYearly': input.mrrInCentsIncludingYearly,
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

/** Unmarshalls a DynamoDB record into a BusinessMetric object */
export function unmarshallBusinessMetric(
  item: Record<string, any>
): BusinessMetric {
  const result: BusinessMetric = {
    arrInCents: unmarshallRequiredField(item, 'arrInCents', [
      'arrInCents',
      'arr_in_cents',
    ]),
    arrInCentsIncludingMonthly: unmarshallRequiredField(
      item,
      'arrInCentsIncludingMonthly',
      ['arrInCentsIncludingMonthly', 'arr_in_cents_including_monthly']
    ),
    count: unmarshallRequiredField(item, 'count', ['count', 'count']),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    id: Base64.encode(`BusinessMetric:${item.pk}#:#${item.sk}`),
    mrrInCents: unmarshallRequiredField(item, 'mrrInCents', [
      'mrrInCents',
      'mrr_in_cents',
    ]),
    mrrInCentsIncludingYearly: unmarshallRequiredField(
      item,
      'mrrInCentsIncludingYearly',
      ['mrrInCentsIncludingYearly', 'mrr_in_cents_including_yearly']
    ),
    onFreeTrial: unmarshallRequiredField(item, 'onFreeTrial', [
      'onFreeTrial',
      'on_free_trial',
    ]),
    planName: unmarshallRequiredField(item, 'planName', [
      'planName',
      'plan_name',
    ]),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
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

export interface BusinessMetricSummaryPrimaryKey {
  onFreeTrial: Scalars['Boolean'];
}

export type CreateBusinessMetricSummaryInput = Omit<
  BusinessMetricSummary,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateBusinessMetricSummaryOutput =
  ResultType<BusinessMetricSummary>;
/**  */
export async function createBusinessMetricSummary(
  input: Readonly<CreateBusinessMetricSummaryInput>
): Promise<Readonly<CreateBusinessMetricSummaryOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallBusinessMetricSummary(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
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
        '#publicId = :publicId',
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
      item._et === 'BusinessMetricSummary',
      () =>
        new DataIntegrityError(
          `Expected to write BusinessMetricSummary but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetricSummary(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('BusinessMetricSummary', {
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

export type BlindWriteBusinessMetricSummaryInput = Omit<
  BusinessMetricSummary,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<BusinessMetricSummary, 'createdAt'>>;

export type BlindWriteBusinessMetricSummaryOutput =
  ResultType<BusinessMetricSummary>;
/** */
export async function blindWriteBusinessMetricSummary(
  input: Readonly<BlindWriteBusinessMetricSummaryInput>
): Promise<Readonly<BlindWriteBusinessMetricSummaryOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallBusinessMetricSummary(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['BUSINESS_METRIC'].join('#'),
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
      item._et === 'BusinessMetricSummary',
      () =>
        new DataIntegrityError(
          `Expected to write BusinessMetricSummary but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetricSummary(item),
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

export type DeleteBusinessMetricSummaryOutput = ResultType<void>;

/**  */
export async function deleteBusinessMetricSummary(
  input: BusinessMetricSummaryPrimaryKey
): Promise<DeleteBusinessMetricSummaryOutput> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['BUSINESS_METRIC'].join('#'),
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
      throw new NotFoundError('BusinessMetricSummary', input);
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

export type ReadBusinessMetricSummaryOutput = ResultType<BusinessMetricSummary>;

/**  */
export async function readBusinessMetricSummary(
  input: BusinessMetricSummaryPrimaryKey
): Promise<Readonly<ReadBusinessMetricSummaryOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

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

    assert(item, () => new NotFoundError('BusinessMetricSummary', input));
    assert(
      item._et === 'BusinessMetricSummary',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a BusinessMetricSummary but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetricSummary(item),
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

export type UpdateBusinessMetricSummaryInput = Omit<
  BusinessMetricSummary,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateBusinessMetricSummaryOutput =
  ResultType<BusinessMetricSummary>;

/**  */
export async function updateBusinessMetricSummary(
  input: Readonly<UpdateBusinessMetricSummaryInput>
): Promise<Readonly<UpdateBusinessMetricSummaryOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallBusinessMetricSummary(input);
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
        pk: ['BUSINESS_METRIC'].join('#'),
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
      item._et === 'BusinessMetricSummary',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            onFreeTrial: input.onFreeTrial,
          })} to update a BusinessMetricSummary but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallBusinessMetricSummary(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readBusinessMetricSummary(input);
      } catch {
        throw new NotFoundError('BusinessMetricSummary', {
          onFreeTrial: input.onFreeTrial,
        });
      }
      throw new OptimisticLockingError('BusinessMetricSummary', {
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

export type QueryBusinessMetricSummaryInput =
  | {}
  | {onFreeTrial: Scalars['Boolean']}
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryBusinessMetricSummaryOutput =
  MultiResultType<BusinessMetricSummary>;

/** helper */
function makeEanForQueryBusinessMetricSummary(
  input: QueryBusinessMetricSummaryInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryBusinessMetricSummary(
  input: QueryBusinessMetricSummaryInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['BUSINESS_METRIC'].join('#'),
      ':sk': makeSortKeyForQuery('SUMMARY', ['onFreeTrial'], input),
    };
  }
}

/** helper */
function makeKceForQueryBusinessMetricSummary(
  input: QueryBusinessMetricSummaryInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryBusinessMetricSummary */
export async function queryBusinessMetricSummary(
  input: Readonly<QueryBusinessMetricSummaryInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryBusinessMetricSummaryOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const ExpressionAttributeNames = makeEanForQueryBusinessMetricSummary(input);
  const ExpressionAttributeValues = makeEavForQueryBusinessMetricSummary(input);
  const KeyConditionExpression = makeKceForQueryBusinessMetricSummary(input, {
    operator,
  });

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'BusinessMetricSummary',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only BusinessMetricSummary was expected.`
            )
        );
        return unmarshallBusinessMetricSummary(item);
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

/** queries the BusinessMetricSummary table by primary key using a node id */
export async function queryBusinessMetricSummaryByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<BusinessMetricSummary>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryBusinessMetricSummaryInput = {};

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.onFreeTrial = Boolean(primaryKeyValues[3]);
  }

  const {capacity, items} = await queryBusinessMetricSummary(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('BusinessMetricSummary', primaryKey)
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple BusinessMetricSummary with id ${id}`
      )
  );

  return {capacity, item: items[0]};
}

/** queries the BusinessMetricSummary table by primary key using a node id */
export async function queryBusinessMetricSummaryByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<BusinessMetricSummary>, 'metrics'>>> {
  const {capacity, items} = await queryBusinessMetricSummary({
    index: 'publicId',
    publicId,
  });

  assert(
    items.length > 0,
    () => new NotFoundError('BusinessMetricSummary', {publicId})
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple BusinessMetricSummary with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallBusinessMetricSummaryOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallBusinessMetricSummaryInput = Required<
  Pick<
    BusinessMetricSummary,
    | 'arrInCents'
    | 'arrInCentsIncludingMonthly'
    | 'count'
    | 'mrrInCents'
    | 'mrrInCentsIncludingYearly'
    | 'onFreeTrial'
  >
> &
  Partial<Pick<BusinessMetricSummary, 'version'>>;

/** Marshalls a DynamoDB record into a BusinessMetricSummary object */
export function marshallBusinessMetricSummary(
  input: MarshallBusinessMetricSummaryInput,
  now = new Date()
): MarshallBusinessMetricSummaryOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#arrInCents = :arrInCents',
    '#arrInCentsIncludingMonthly = :arrInCentsIncludingMonthly',
    '#count = :count',
    '#mrrInCents = :mrrInCents',
    '#mrrInCentsIncludingYearly = :mrrInCentsIncludingYearly',
    '#onFreeTrial = :onFreeTrial',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#arrInCents': 'arrInCents',
    '#arrInCentsIncludingMonthly': 'arrInCentsIncludingMonthly',
    '#count': 'count',
    '#mrrInCents': 'mrrInCents',
    '#mrrInCentsIncludingYearly': 'mrrInCentsIncludingYearly',
    '#onFreeTrial': 'onFreeTrial',
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'BusinessMetricSummary',
    ':arrInCents': input.arrInCents,
    ':arrInCentsIncludingMonthly': input.arrInCentsIncludingMonthly,
    ':count': input.count,
    ':mrrInCents': input.mrrInCents,
    ':mrrInCentsIncludingYearly': input.mrrInCentsIncludingYearly,
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

/** Unmarshalls a DynamoDB record into a BusinessMetricSummary object */
export function unmarshallBusinessMetricSummary(
  item: Record<string, any>
): BusinessMetricSummary {
  const result: BusinessMetricSummary = {
    arrInCents: unmarshallRequiredField(item, 'arrInCents', [
      'arrInCents',
      'arr_in_cents',
    ]),
    arrInCentsIncludingMonthly: unmarshallRequiredField(
      item,
      'arrInCentsIncludingMonthly',
      ['arrInCentsIncludingMonthly', 'arr_in_cents_including_monthly']
    ),
    count: unmarshallRequiredField(item, 'count', ['count', 'count']),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    id: Base64.encode(`BusinessMetricSummary:${item.pk}#:#${item.sk}`),
    mrrInCents: unmarshallRequiredField(item, 'mrrInCents', [
      'mrrInCents',
      'mrr_in_cents',
    ]),
    mrrInCentsIncludingYearly: unmarshallRequiredField(
      item,
      'mrrInCentsIncludingYearly',
      ['mrrInCentsIncludingYearly', 'mrr_in_cents_including_yearly']
    ),
    onFreeTrial: unmarshallRequiredField(item, 'onFreeTrial', [
      'onFreeTrial',
      'on_free_trial',
    ]),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
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

export interface CaseInstancePrimaryKey {
  branchName: Scalars['String'];
  label?: Maybe<Scalars['String']>;
  lineage: Scalars['String'];
  repoId: Scalars['String'];
  retry: Scalars['Int'];
  sha: Scalars['String'];
  vendor: Vendor;
}

export type CreateCaseInstanceInput = Omit<
  CaseInstance,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreateCaseInstanceOutput = ResultType<CaseInstance>;
/**  */
export async function createCaseInstance(
  input: Readonly<CreateCaseInstanceInput>
): Promise<Readonly<CreateCaseInstanceOutput>> {
  const tableName = process.env.TABLE_CASE_INSTANCE;
  assert(tableName, 'TABLE_CASE_INSTANCE is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCaseInstance(input, now);

  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',

        '#lsi1sk': 'lsi1sk',
        '#lsi2sk': 'lsi2sk',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),

        ':lsi1sk': ['INSTANCE', now.getTime()].join('#'),
        ':lsi2sk': ['INSTANCE', input.conclusion, now.getTime()].join('#'),
      },
      Key: {
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
          input.lineage,
        ].join('#'),
        sk: ['INSTANCE', input.sha, input.retry].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',

        '#lsi1sk = :lsi1sk',
        '#lsi2sk = :lsi2sk',
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
      item._et === 'CaseInstance',
      () =>
        new DataIntegrityError(
          `Expected to write CaseInstance but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseInstance(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('CaseInstance', {
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
          input.lineage,
        ].join('#'),
        sk: ['INSTANCE', input.sha, input.retry].join('#'),
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

export type BlindWriteCaseInstanceInput = Omit<
  CaseInstance,
  'createdAt' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<CaseInstance, 'createdAt'>>;

export type BlindWriteCaseInstanceOutput = ResultType<CaseInstance>;
/** */
export async function blindWriteCaseInstance(
  input: Readonly<BlindWriteCaseInstanceInput>
): Promise<Readonly<BlindWriteCaseInstanceOutput>> {
  const tableName = process.env.TABLE_CASE_INSTANCE;
  assert(tableName, 'TABLE_CASE_INSTANCE is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCaseInstance(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',

    '#lsi1sk': 'lsi1sk',
    '#lsi2sk': 'lsi2sk',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),

    ':lsi1sk': [
      'INSTANCE',
      'createdAt' in input && typeof input.createdAt !== 'undefined'
        ? input.createdAt.getTime()
        : now.getTime(),
    ].join('#'),
    ':lsi2sk': [
      'INSTANCE',
      input.conclusion,
      'createdAt' in input && typeof input.createdAt !== 'undefined'
        ? input.createdAt.getTime()
        : now.getTime(),
    ].join('#'),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',

    '#lsi1sk = :lsi1sk',
    '#lsi2sk = :lsi2sk',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: [
        'CASE',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
        input.lineage,
      ].join('#'),
      sk: ['INSTANCE', input.sha, input.retry].join('#'),
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
      item._et === 'CaseInstance',
      () =>
        new DataIntegrityError(
          `Expected to write CaseInstance but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseInstance(item),
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

export type DeleteCaseInstanceOutput = ResultType<void>;

/**  */
export async function deleteCaseInstance(
  input: CaseInstancePrimaryKey
): Promise<DeleteCaseInstanceOutput> {
  const tableName = process.env.TABLE_CASE_INSTANCE;
  assert(tableName, 'TABLE_CASE_INSTANCE is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
          input.lineage,
        ].join('#'),
        sk: ['INSTANCE', input.sha, input.retry].join('#'),
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
      throw new NotFoundError('CaseInstance', input);
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

export type ReadCaseInstanceOutput = ResultType<CaseInstance>;

/**  */
export async function readCaseInstance(
  input: CaseInstancePrimaryKey
): Promise<Readonly<ReadCaseInstanceOutput>> {
  const tableName = process.env.TABLE_CASE_INSTANCE;
  assert(tableName, 'TABLE_CASE_INSTANCE is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: [
        'CASE',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
        input.lineage,
      ].join('#'),
      sk: ['INSTANCE', input.sha, input.retry].join('#'),
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

    assert(item, () => new NotFoundError('CaseInstance', input));
    assert(
      item._et === 'CaseInstance',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a CaseInstance but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseInstance(item),
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

export type UpdateCaseInstanceInput = Omit<
  CaseInstance,
  'createdAt' | 'id' | 'updatedAt'
>;
export type UpdateCaseInstanceOutput = ResultType<CaseInstance>;

/**  */
export async function updateCaseInstance(
  input: Readonly<UpdateCaseInstanceInput>
): Promise<Readonly<UpdateCaseInstanceOutput>> {
  const tableName = process.env.TABLE_CASE_INSTANCE;
  assert(tableName, 'TABLE_CASE_INSTANCE is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCaseInstance(input);
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
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
          input.lineage,
        ].join('#'),
        sk: ['INSTANCE', input.sha, input.retry].join('#'),
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
      item._et === 'CaseInstance',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            branchName: input.branchName,
            label: input.label,
            lineage: input.lineage,
            repoId: input.repoId,
            retry: input.retry,
            sha: input.sha,
            vendor: input.vendor,
          })} to update a CaseInstance but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseInstance(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readCaseInstance(input);
      } catch {
        throw new NotFoundError('CaseInstance', {
          branchName: input.branchName,
          label: input.label,
          lineage: input.lineage,
          repoId: input.repoId,
          retry: input.retry,
          sha: input.sha,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('CaseInstance', {
        branchName: input.branchName,
        label: input.label,
        lineage: input.lineage,
        repoId: input.repoId,
        retry: input.retry,
        sha: input.sha,
        vendor: input.vendor,
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

export type QueryCaseInstanceInput =
  | {
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      sha: Scalars['String'];
      vendor: Vendor;
    }
  | {
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      retry: Scalars['Int'];
      sha: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'gsi1';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      sha: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'gsi1';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      sha: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'gsi1';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      retry: Scalars['Int'];
      sha: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'gsi2';
      branchName: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'gsi2';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'gsi2';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      sha: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi1';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi1';
      branchName: Scalars['String'];
      createdAt: Scalars['Date'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi2';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi2';
      branchName: Scalars['String'];
      conclusion: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi2';
      branchName: Scalars['String'];
      conclusion: Scalars['String'];
      createdAt: Scalars['Date'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    };
export type QueryCaseInstanceOutput = MultiResultType<CaseInstance>;

/** helper */
function makeEanForQueryCaseInstance(
  input: QueryCaseInstanceInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'gsi2') {
      return {'#pk': 'gsi2pk', '#sk': 'gsi2sk'};
    } else if (input.index === 'lsi1') {
      return {'#pk': 'pk', '#sk': 'lsi1sk'};
    } else if (input.index === 'lsi2') {
      return {'#pk': 'pk', '#sk': 'lsi2sk'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryCaseInstance(
  input: QueryCaseInstanceInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
          input.sha,
        ].join('#'),
        ':sk': makeSortKeyForQuery('INSTANCE', ['lineage', 'retry'], input),
      };
    } else if (input.index === 'gsi2') {
      return {
        ':pk': ['CASE', input.vendor, input.repoId, input.branchName].join('#'),
        ':sk': makeSortKeyForQuery('INSTANCE', ['label', 'sha'], input),
      };
    } else if (input.index === 'lsi1') {
      return {
        ':pk': [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
          input.lineage,
        ].join('#'),
        ':sk': makeSortKeyForQuery('INSTANCE', ['createdAt'], input),
      };
    } else if (input.index === 'lsi2') {
      return {
        ':pk': [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
          input.lineage,
        ].join('#'),
        ':sk': makeSortKeyForQuery(
          'INSTANCE',
          ['conclusion', 'createdAt'],
          input
        ),
      };
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': [
        'CASE',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
        input.lineage,
      ].join('#'),
      ':sk': makeSortKeyForQuery('INSTANCE', ['sha', 'retry'], input),
    };
  }
}

/** helper */
function makeKceForQueryCaseInstance(
  input: QueryCaseInstanceInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'gsi2') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'lsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'lsi2') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryCaseInstance */
export async function queryCaseInstance(
  input: Readonly<QueryCaseInstanceInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryCaseInstanceOutput>> {
  const tableName = process.env.TABLE_CASE_INSTANCE;
  assert(tableName, 'TABLE_CASE_INSTANCE is not set');

  const ExpressionAttributeNames = makeEanForQueryCaseInstance(input);
  const ExpressionAttributeValues = makeEavForQueryCaseInstance(input);
  const KeyConditionExpression = makeKceForQueryCaseInstance(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'CaseInstance',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only CaseInstance was expected.`
            )
        );
        return unmarshallCaseInstance(item);
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

/** queries the CaseInstance table by primary key using a node id */
export async function queryCaseInstanceByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<CaseInstance>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryCaseInstanceInput = {
    vendor: primaryKeyValues[1] as Vendor,
    repoId: primaryKeyValues[2],
    branchName: primaryKeyValues[3],
    label: primaryKeyValues[4],
    lineage: primaryKeyValues[5],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.sha = primaryKeyValues[8];
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.retry = Number(primaryKeyValues[9]);
  }

  const {capacity, items} = await queryCaseInstance(primaryKey);

  assert(items.length > 0, () => new NotFoundError('CaseInstance', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple CaseInstance with id ${id}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallCaseInstanceOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallCaseInstanceInput = Required<
  Pick<
    CaseInstance,
    | 'branchName'
    | 'conclusion'
    | 'lineage'
    | 'repoId'
    | 'retry'
    | 'sha'
    | 'vendor'
  >
> &
  Partial<Pick<CaseInstance, 'duration' | 'filename' | 'label' | 'version'>>;

/** Marshalls a DynamoDB record into a CaseInstance object */
export function marshallCaseInstance(
  input: MarshallCaseInstanceInput,
  now = new Date()
): MarshallCaseInstanceOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#branchName = :branchName',
    '#conclusion = :conclusion',
    '#lineage = :lineage',
    '#repoId = :repoId',
    '#retry = :retry',
    '#sha = :sha',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
    '#gsi2pk = :gsi2pk',
    '#gsi2sk = :gsi2sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#branchName': 'branch_name',
    '#conclusion': 'conclusion',
    '#lineage': 'lineage',
    '#repoId': 'repo_id',
    '#retry': 'retry',
    '#sha': 'sha',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
    '#gsi2pk': 'gsi2pk',
    '#gsi2sk': 'gsi2sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'CaseInstance',
    ':branchName': input.branchName,
    ':conclusion': input.conclusion,
    ':lineage': input.lineage,
    ':repoId': input.repoId,
    ':retry': input.retry,
    ':sha': input.sha,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': [
      'CASE',
      input.vendor,
      input.repoId,
      input.branchName,
      input.label,
      input.sha,
    ].join('#'),
    ':gsi1sk': ['INSTANCE', input.lineage, input.retry].join('#'),
    ':gsi2pk': ['CASE', input.vendor, input.repoId, input.branchName].join('#'),
    ':gsi2sk': ['INSTANCE', input.label, input.sha].join('#'),
  };

  if ('duration' in input && typeof input.duration !== 'undefined') {
    ean['#duration'] = 'duration';
    eav[':duration'] = input.duration;
    updateExpression.push('#duration = :duration');
  }

  if ('filename' in input && typeof input.filename !== 'undefined') {
    ean['#filename'] = 'filename';
    eav[':filename'] = input.filename;
    updateExpression.push('#filename = :filename');
  }

  if ('label' in input && typeof input.label !== 'undefined') {
    ean['#label'] = 'label';
    eav[':label'] = input.label;
    updateExpression.push('#label = :label');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a CaseInstance object */
export function unmarshallCaseInstance(
  item: Record<string, any>
): CaseInstance {
  let result: CaseInstance = {
    branchName: unmarshallRequiredField(item, 'branchName', [
      'branch_name',
      'branchName',
    ]),
    conclusion: unmarshallRequiredField(item, 'conclusion', [
      'conclusion',
      'conclusion',
    ]),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    id: Base64.encode(`CaseInstance:${item.pk}#:#${item.sk}`),
    lineage: unmarshallRequiredField(item, 'lineage', ['lineage', 'lineage']),
    repoId: unmarshallRequiredField(item, 'repoId', ['repo_id', 'repoId']),
    retry: unmarshallRequiredField(item, 'retry', ['retry', 'retry']),
    sha: unmarshallRequiredField(item, 'sha', ['sha', 'sha']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('duration' in item || 'duration' in item) {
    result = {
      ...result,
      duration: unmarshallOptionalField(item, 'duration', [
        'duration',
        'duration',
      ]),
    };
  }
  if ('filename' in item || 'filename' in item) {
    result = {
      ...result,
      filename: unmarshallOptionalField(item, 'filename', [
        'filename',
        'filename',
      ]),
    };
  }
  if ('label' in item || 'label' in item) {
    result = {
      ...result,
      label: unmarshallOptionalField(item, 'label', ['label', 'label']),
    };
  }

  return result;
}

export interface CaseSummaryPrimaryKey {
  branchName: Scalars['String'];
  label?: Maybe<Scalars['String']>;
  lineage: Scalars['String'];
  repoId: Scalars['String'];
  vendor: Vendor;
}

export type CreateCaseSummaryInput = Omit<
  CaseSummary,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreateCaseSummaryOutput = ResultType<CaseSummary>;
/**  */
export async function createCaseSummary(
  input: Readonly<CreateCaseSummaryInput>
): Promise<Readonly<CreateCaseSummaryOutput>> {
  const tableName = process.env.TABLE_CASE_SUMMARY;
  assert(tableName, 'TABLE_CASE_SUMMARY is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCaseSummary(input, now);

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
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['SUMMARY', input.lineage].join('#'),
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
      item._et === 'CaseSummary',
      () =>
        new DataIntegrityError(
          `Expected to write CaseSummary but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseSummary(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('CaseSummary', {
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['SUMMARY', input.lineage].join('#'),
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

export type BlindWriteCaseSummaryInput = Omit<
  CaseSummary,
  'createdAt' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<CaseSummary, 'createdAt'>>;

export type BlindWriteCaseSummaryOutput = ResultType<CaseSummary>;
/** */
export async function blindWriteCaseSummary(
  input: Readonly<BlindWriteCaseSummaryInput>
): Promise<Readonly<BlindWriteCaseSummaryOutput>> {
  const tableName = process.env.TABLE_CASE_SUMMARY;
  assert(tableName, 'TABLE_CASE_SUMMARY is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCaseSummary(input, now);

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
      pk: [
        'CASE',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
      ].join('#'),
      sk: ['SUMMARY', input.lineage].join('#'),
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
      item._et === 'CaseSummary',
      () =>
        new DataIntegrityError(
          `Expected to write CaseSummary but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseSummary(item),
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

export type DeleteCaseSummaryOutput = ResultType<void>;

/**  */
export async function deleteCaseSummary(
  input: CaseSummaryPrimaryKey
): Promise<DeleteCaseSummaryOutput> {
  const tableName = process.env.TABLE_CASE_SUMMARY;
  assert(tableName, 'TABLE_CASE_SUMMARY is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['SUMMARY', input.lineage].join('#'),
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
      throw new NotFoundError('CaseSummary', input);
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

export type ReadCaseSummaryOutput = ResultType<CaseSummary>;

/**  */
export async function readCaseSummary(
  input: CaseSummaryPrimaryKey
): Promise<Readonly<ReadCaseSummaryOutput>> {
  const tableName = process.env.TABLE_CASE_SUMMARY;
  assert(tableName, 'TABLE_CASE_SUMMARY is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: [
        'CASE',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
      ].join('#'),
      sk: ['SUMMARY', input.lineage].join('#'),
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

    assert(item, () => new NotFoundError('CaseSummary', input));
    assert(
      item._et === 'CaseSummary',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a CaseSummary but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseSummary(item),
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

export type UpdateCaseSummaryInput = Omit<
  CaseSummary,
  'createdAt' | 'id' | 'updatedAt'
>;
export type UpdateCaseSummaryOutput = ResultType<CaseSummary>;

/**  */
export async function updateCaseSummary(
  input: Readonly<UpdateCaseSummaryInput>
): Promise<Readonly<UpdateCaseSummaryOutput>> {
  const tableName = process.env.TABLE_CASE_SUMMARY;
  assert(tableName, 'TABLE_CASE_SUMMARY is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCaseSummary(input);
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
        pk: [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['SUMMARY', input.lineage].join('#'),
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
      item._et === 'CaseSummary',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            branchName: input.branchName,
            label: input.label,
            lineage: input.lineage,
            repoId: input.repoId,
            vendor: input.vendor,
          })} to update a CaseSummary but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCaseSummary(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readCaseSummary(input);
      } catch {
        throw new NotFoundError('CaseSummary', {
          branchName: input.branchName,
          label: input.label,
          lineage: input.lineage,
          repoId: input.repoId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('CaseSummary', {
        branchName: input.branchName,
        label: input.label,
        lineage: input.lineage,
        repoId: input.repoId,
        vendor: input.vendor,
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

export type QueryCaseSummaryInput =
  | {
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      lineage: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi1';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi1';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      stability: Scalars['Float'];
      vendor: Vendor;
    }
  | {
      index: 'lsi2';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi2';
      branchName: Scalars['String'];
      duration: Scalars['Float'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    };
export type QueryCaseSummaryOutput = MultiResultType<CaseSummary>;

/** helper */
function makeEanForQueryCaseSummary(
  input: QueryCaseSummaryInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'lsi1') {
      return {'#pk': 'pk', '#sk': 'lsi1sk'};
    } else if (input.index === 'lsi2') {
      return {'#pk': 'pk', '#sk': 'lsi2sk'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryCaseSummary(
  input: QueryCaseSummaryInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'lsi1') {
      return {
        ':pk': [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        ':sk': makeSortKeyForQuery('SUMMARY', ['stability'], input),
      };
    } else if (input.index === 'lsi2') {
      return {
        ':pk': [
          'CASE',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        ':sk': makeSortKeyForQuery('SUMMARY', ['duration'], input),
      };
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': [
        'CASE',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
      ].join('#'),
      ':sk': makeSortKeyForQuery('SUMMARY', ['lineage'], input),
    };
  }
}

/** helper */
function makeKceForQueryCaseSummary(
  input: QueryCaseSummaryInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'lsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'lsi2') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryCaseSummary */
export async function queryCaseSummary(
  input: Readonly<QueryCaseSummaryInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryCaseSummaryOutput>> {
  const tableName = process.env.TABLE_CASE_SUMMARY;
  assert(tableName, 'TABLE_CASE_SUMMARY is not set');

  const ExpressionAttributeNames = makeEanForQueryCaseSummary(input);
  const ExpressionAttributeValues = makeEavForQueryCaseSummary(input);
  const KeyConditionExpression = makeKceForQueryCaseSummary(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'CaseSummary',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only CaseSummary was expected.`
            )
        );
        return unmarshallCaseSummary(item);
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

/** queries the CaseSummary table by primary key using a node id */
export async function queryCaseSummaryByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<CaseSummary>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryCaseSummaryInput = {
    vendor: primaryKeyValues[1] as Vendor,
    repoId: primaryKeyValues[2],
    branchName: primaryKeyValues[3],
    label: primaryKeyValues[4],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.lineage = primaryKeyValues[7];
  }

  const {capacity, items} = await queryCaseSummary(primaryKey);

  assert(items.length > 0, () => new NotFoundError('CaseSummary', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple CaseSummary with id ${id}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallCaseSummaryOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallCaseSummaryInput = Required<
  Pick<
    CaseSummary,
    'branchName' | 'duration' | 'lineage' | 'repoId' | 'stability' | 'vendor'
  >
> &
  Partial<Pick<CaseSummary, 'label' | 'version'>>;

/** Marshalls a DynamoDB record into a CaseSummary object */
export function marshallCaseSummary(
  input: MarshallCaseSummaryInput,
  now = new Date()
): MarshallCaseSummaryOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#branchName = :branchName',
    '#duration = :duration',
    '#lineage = :lineage',
    '#repoId = :repoId',
    '#stability = :stability',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#lsi1sk = :lsi1sk',
    '#lsi2sk = :lsi2sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#branchName': 'branch_name',
    '#duration': 'duration',
    '#lineage': 'lineage',
    '#repoId': 'repo_id',
    '#stability': 'stability',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#lsi1sk': 'lsi1sk',
    '#lsi2sk': 'lsi2sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'CaseSummary',
    ':branchName': input.branchName,
    ':duration': input.duration,
    ':lineage': input.lineage,
    ':repoId': input.repoId,
    ':stability': input.stability,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':lsi1sk': ['SUMMARY', input.stability].join('#'),
    ':lsi2sk': ['SUMMARY', input.duration].join('#'),
  };

  if ('label' in input && typeof input.label !== 'undefined') {
    ean['#label'] = 'label';
    eav[':label'] = input.label;
    updateExpression.push('#label = :label');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a CaseSummary object */
export function unmarshallCaseSummary(item: Record<string, any>): CaseSummary {
  let result: CaseSummary = {
    branchName: unmarshallRequiredField(item, 'branchName', [
      'branch_name',
      'branchName',
    ]),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    duration: unmarshallRequiredField(item, 'duration', [
      'duration',
      'duration',
    ]),
    id: Base64.encode(`CaseSummary:${item.pk}#:#${item.sk}`),
    lineage: unmarshallRequiredField(item, 'lineage', ['lineage', 'lineage']),
    repoId: unmarshallRequiredField(item, 'repoId', ['repo_id', 'repoId']),
    stability: unmarshallRequiredField(item, 'stability', [
      'stability',
      'stability',
    ]),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('label' in item || 'label' in item) {
    result = {
      ...result,
      label: unmarshallOptionalField(item, 'label', ['label', 'label']),
    };
  }

  return result;
}

export interface CheckSuiteLockPrimaryKey {
  label?: Maybe<Scalars['String']>;
  repoId: Scalars['String'];
  sha: Scalars['String'];
}

export type CreateCheckSuiteLockInput = Omit<
  CheckSuiteLock,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreateCheckSuiteLockOutput = ResultType<CheckSuiteLock>;
/**  */
export async function createCheckSuiteLock(
  input: Readonly<CreateCheckSuiteLockInput>
): Promise<Readonly<CreateCheckSuiteLockOutput>> {
  const tableName = process.env.TABLE_CHECK_SUITE_LOCKS;
  assert(tableName, 'TABLE_CHECK_SUITE_LOCKS is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCheckSuiteLock(input, now);

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
        pk: ['GH', input.repoId, input.sha].join('#'),
        sk: ['LOCK', input.label].join('#'),
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
      item._et === 'CheckSuiteLock',
      () =>
        new DataIntegrityError(
          `Expected to write CheckSuiteLock but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCheckSuiteLock(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('CheckSuiteLock', {
        pk: ['GH', input.repoId, input.sha].join('#'),
        sk: ['LOCK', input.label].join('#'),
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

export type BlindWriteCheckSuiteLockInput = Omit<
  CheckSuiteLock,
  'createdAt' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<CheckSuiteLock, 'createdAt'>>;

export type BlindWriteCheckSuiteLockOutput = ResultType<CheckSuiteLock>;
/** */
export async function blindWriteCheckSuiteLock(
  input: Readonly<BlindWriteCheckSuiteLockInput>
): Promise<Readonly<BlindWriteCheckSuiteLockOutput>> {
  const tableName = process.env.TABLE_CHECK_SUITE_LOCKS;
  assert(tableName, 'TABLE_CHECK_SUITE_LOCKS is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCheckSuiteLock(input, now);

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
      pk: ['GH', input.repoId, input.sha].join('#'),
      sk: ['LOCK', input.label].join('#'),
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
      item._et === 'CheckSuiteLock',
      () =>
        new DataIntegrityError(
          `Expected to write CheckSuiteLock but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCheckSuiteLock(item),
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

export type DeleteCheckSuiteLockOutput = ResultType<void>;

/**  */
export async function deleteCheckSuiteLock(
  input: CheckSuiteLockPrimaryKey
): Promise<DeleteCheckSuiteLockOutput> {
  const tableName = process.env.TABLE_CHECK_SUITE_LOCKS;
  assert(tableName, 'TABLE_CHECK_SUITE_LOCKS is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['GH', input.repoId, input.sha].join('#'),
        sk: ['LOCK', input.label].join('#'),
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
      throw new NotFoundError('CheckSuiteLock', input);
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

export type ReadCheckSuiteLockOutput = ResultType<CheckSuiteLock>;

/**  */
export async function readCheckSuiteLock(
  input: CheckSuiteLockPrimaryKey
): Promise<Readonly<ReadCheckSuiteLockOutput>> {
  const tableName = process.env.TABLE_CHECK_SUITE_LOCKS;
  assert(tableName, 'TABLE_CHECK_SUITE_LOCKS is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['GH', input.repoId, input.sha].join('#'),
      sk: ['LOCK', input.label].join('#'),
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

    assert(item, () => new NotFoundError('CheckSuiteLock', input));
    assert(
      item._et === 'CheckSuiteLock',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a CheckSuiteLock but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCheckSuiteLock(item),
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

export type UpdateCheckSuiteLockInput = Omit<
  CheckSuiteLock,
  'createdAt' | 'id' | 'updatedAt'
>;
export type UpdateCheckSuiteLockOutput = ResultType<CheckSuiteLock>;

/**  */
export async function updateCheckSuiteLock(
  input: Readonly<UpdateCheckSuiteLockInput>
): Promise<Readonly<UpdateCheckSuiteLockOutput>> {
  const tableName = process.env.TABLE_CHECK_SUITE_LOCKS;
  assert(tableName, 'TABLE_CHECK_SUITE_LOCKS is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallCheckSuiteLock(input);
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
        pk: ['GH', input.repoId, input.sha].join('#'),
        sk: ['LOCK', input.label].join('#'),
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
      item._et === 'CheckSuiteLock',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            label: input.label,
            repoId: input.repoId,
            sha: input.sha,
          })} to update a CheckSuiteLock but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallCheckSuiteLock(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readCheckSuiteLock(input);
      } catch {
        throw new NotFoundError('CheckSuiteLock', {
          label: input.label,
          repoId: input.repoId,
          sha: input.sha,
        });
      }
      throw new OptimisticLockingError('CheckSuiteLock', {
        label: input.label,
        repoId: input.repoId,
        sha: input.sha,
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

export type QueryCheckSuiteLockInput =
  | {repoId: Scalars['String']; sha: Scalars['String']}
  | {
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      sha: Scalars['String'];
    };
export type QueryCheckSuiteLockOutput = MultiResultType<CheckSuiteLock>;

/** helper */
function makeEanForQueryCheckSuiteLock(
  input: QueryCheckSuiteLockInput
): Record<string, string> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryCheckSuiteLock(
  input: QueryCheckSuiteLockInput
): Record<string, any> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['GH', input.repoId, input.sha].join('#'),
      ':sk': makeSortKeyForQuery('LOCK', ['label'], input),
    };
  }
}

/** helper */
function makeKceForQueryCheckSuiteLock(
  input: QueryCheckSuiteLockInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryCheckSuiteLock */
export async function queryCheckSuiteLock(
  input: Readonly<QueryCheckSuiteLockInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryCheckSuiteLockOutput>> {
  const tableName = process.env.TABLE_CHECK_SUITE_LOCKS;
  assert(tableName, 'TABLE_CHECK_SUITE_LOCKS is not set');

  const ExpressionAttributeNames = makeEanForQueryCheckSuiteLock(input);
  const ExpressionAttributeValues = makeEavForQueryCheckSuiteLock(input);
  const KeyConditionExpression = makeKceForQueryCheckSuiteLock(input, {
    operator,
  });

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'CheckSuiteLock',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only CheckSuiteLock was expected.`
            )
        );
        return unmarshallCheckSuiteLock(item);
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

/** queries the CheckSuiteLock table by primary key using a node id */
export async function queryCheckSuiteLockByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<CheckSuiteLock>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryCheckSuiteLockInput = {
    repoId: primaryKeyValues[1],
    sha: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.label = primaryKeyValues[5];
  }

  const {capacity, items} = await queryCheckSuiteLock(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('CheckSuiteLock', primaryKey)
  );
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple CheckSuiteLock with id ${id}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallCheckSuiteLockOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallCheckSuiteLockInput = Required<
  Pick<CheckSuiteLock, 'repoId' | 'sha'>
> &
  Partial<Pick<CheckSuiteLock, 'label' | 'version'>>;

/** Marshalls a DynamoDB record into a CheckSuiteLock object */
export function marshallCheckSuiteLock(
  input: MarshallCheckSuiteLockInput,
  now = new Date()
): MarshallCheckSuiteLockOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#repoId = :repoId',
    '#sha = :sha',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#repoId': 'repoId',
    '#sha': 'sha',
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'CheckSuiteLock',
    ':repoId': input.repoId,
    ':sha': input.sha,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  if ('label' in input && typeof input.label !== 'undefined') {
    ean['#label'] = 'label';
    eav[':label'] = input.label;
    updateExpression.push('#label = :label');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a CheckSuiteLock object */
export function unmarshallCheckSuiteLock(
  item: Record<string, any>
): CheckSuiteLock {
  let result: CheckSuiteLock = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    id: Base64.encode(`CheckSuiteLock:${item.pk}#:#${item.sk}`),
    repoId: unmarshallRequiredField(item, 'repoId', ['repoId', 'repo_id']),
    sha: unmarshallRequiredField(item, 'sha', ['sha', 'sha']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('label' in item || 'label' in item) {
    result = {
      ...result,
      label: unmarshallOptionalField(item, 'label', ['label', 'label']),
    };
  }

  return result;
}

export interface FileTimingPrimaryKey {
  branchName: Scalars['String'];
  filename: Scalars['String'];
  label?: Maybe<Scalars['String']>;
  repoId: Scalars['String'];
  vendor: Vendor;
}

export type CreateFileTimingInput = Omit<
  FileTiming,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreateFileTimingOutput = ResultType<FileTiming>;
/**  */
export async function createFileTiming(
  input: Readonly<CreateFileTimingInput>
): Promise<Readonly<CreateFileTimingOutput>> {
  const tableName = process.env.TABLE_FILE_TIMING;
  assert(tableName, 'TABLE_FILE_TIMING is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallFileTiming(input, now);

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
        pk: [
          'TIMING',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['FILE', input.filename].join('#'),
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
      item._et === 'FileTiming',
      () =>
        new DataIntegrityError(
          `Expected to write FileTiming but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallFileTiming(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('FileTiming', {
        pk: [
          'TIMING',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['FILE', input.filename].join('#'),
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

export type BlindWriteFileTimingInput = Omit<
  FileTiming,
  'createdAt' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<FileTiming, 'createdAt'>>;

export type BlindWriteFileTimingOutput = ResultType<FileTiming>;
/** */
export async function blindWriteFileTiming(
  input: Readonly<BlindWriteFileTimingInput>
): Promise<Readonly<BlindWriteFileTimingOutput>> {
  const tableName = process.env.TABLE_FILE_TIMING;
  assert(tableName, 'TABLE_FILE_TIMING is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallFileTiming(input, now);

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
      pk: [
        'TIMING',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
      ].join('#'),
      sk: ['FILE', input.filename].join('#'),
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
      item._et === 'FileTiming',
      () =>
        new DataIntegrityError(
          `Expected to write FileTiming but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallFileTiming(item),
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

export type DeleteFileTimingOutput = ResultType<void>;

/**  */
export async function deleteFileTiming(
  input: FileTimingPrimaryKey
): Promise<DeleteFileTimingOutput> {
  const tableName = process.env.TABLE_FILE_TIMING;
  assert(tableName, 'TABLE_FILE_TIMING is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: [
          'TIMING',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['FILE', input.filename].join('#'),
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
      throw new NotFoundError('FileTiming', input);
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

export type ReadFileTimingOutput = ResultType<FileTiming>;

/**  */
export async function readFileTiming(
  input: FileTimingPrimaryKey
): Promise<Readonly<ReadFileTimingOutput>> {
  const tableName = process.env.TABLE_FILE_TIMING;
  assert(tableName, 'TABLE_FILE_TIMING is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: [
        'TIMING',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
      ].join('#'),
      sk: ['FILE', input.filename].join('#'),
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

    assert(item, () => new NotFoundError('FileTiming', input));
    assert(
      item._et === 'FileTiming',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a FileTiming but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallFileTiming(item),
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

export type UpdateFileTimingInput = Omit<
  FileTiming,
  'createdAt' | 'id' | 'updatedAt'
>;
export type UpdateFileTimingOutput = ResultType<FileTiming>;

/**  */
export async function updateFileTiming(
  input: Readonly<UpdateFileTimingInput>
): Promise<Readonly<UpdateFileTimingOutput>> {
  const tableName = process.env.TABLE_FILE_TIMING;
  assert(tableName, 'TABLE_FILE_TIMING is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallFileTiming(input);
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
        pk: [
          'TIMING',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        sk: ['FILE', input.filename].join('#'),
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
      item._et === 'FileTiming',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            branchName: input.branchName,
            filename: input.filename,
            label: input.label,
            repoId: input.repoId,
            vendor: input.vendor,
          })} to update a FileTiming but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallFileTiming(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readFileTiming(input);
      } catch {
        throw new NotFoundError('FileTiming', {
          branchName: input.branchName,
          filename: input.filename,
          label: input.label,
          repoId: input.repoId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('FileTiming', {
        branchName: input.branchName,
        filename: input.filename,
        label: input.label,
        repoId: input.repoId,
        vendor: input.vendor,
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

export type QueryFileTimingInput =
  | {
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      branchName: Scalars['String'];
      filename: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'gsi2';
      branchName: Scalars['String'];
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi1';
      branchName: Scalars['String'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      index: 'lsi1';
      branchName: Scalars['String'];
      duration: Scalars['Float'];
      label?: Maybe<Scalars['String']>;
      repoId: Scalars['String'];
      vendor: Vendor;
    };
export type QueryFileTimingOutput = MultiResultType<FileTiming>;

/** helper */
function makeEanForQueryFileTiming(
  input: QueryFileTimingInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi2') {
      return {'#pk': 'gsi2pk', '#sk': 'gsi2sk'};
    } else if (input.index === 'lsi1') {
      return {'#pk': 'pk', '#sk': 'lsi1sk'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryFileTiming(
  input: QueryFileTimingInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi2') {
      return {
        ':pk': ['BRANCH', input.vendor, input.repoId, input.branchName].join(
          '#'
        ),
        ':sk': makeSortKeyForQuery('FILE', [], input),
      };
    } else if (input.index === 'lsi1') {
      return {
        ':pk': [
          'TIMING',
          input.vendor,
          input.repoId,
          input.branchName,
          input.label,
        ].join('#'),
        ':sk': makeSortKeyForQuery('FILE', ['duration'], input),
      };
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': [
        'TIMING',
        input.vendor,
        input.repoId,
        input.branchName,
        input.label,
      ].join('#'),
      ':sk': makeSortKeyForQuery('FILE', ['filename'], input),
    };
  }
}

/** helper */
function makeKceForQueryFileTiming(
  input: QueryFileTimingInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi2') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'lsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryFileTiming */
export async function queryFileTiming(
  input: Readonly<QueryFileTimingInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryFileTimingOutput>> {
  const tableName = process.env.TABLE_FILE_TIMING;
  assert(tableName, 'TABLE_FILE_TIMING is not set');

  const ExpressionAttributeNames = makeEanForQueryFileTiming(input);
  const ExpressionAttributeValues = makeEavForQueryFileTiming(input);
  const KeyConditionExpression = makeKceForQueryFileTiming(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'FileTiming',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only FileTiming was expected.`
            )
        );
        return unmarshallFileTiming(item);
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

/** queries the FileTiming table by primary key using a node id */
export async function queryFileTimingByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<FileTiming>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryFileTimingInput = {
    vendor: primaryKeyValues[1] as Vendor,
    repoId: primaryKeyValues[2],
    branchName: primaryKeyValues[3],
    label: primaryKeyValues[4],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.filename = primaryKeyValues[7];
  }

  const {capacity, items} = await queryFileTiming(primaryKey);

  assert(items.length > 0, () => new NotFoundError('FileTiming', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple FileTiming with id ${id}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallFileTimingOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallFileTimingInput = Required<
  Pick<FileTiming, 'branchName' | 'duration' | 'filename' | 'repoId' | 'vendor'>
> &
  Partial<Pick<FileTiming, 'label' | 'version'>>;

/** Marshalls a DynamoDB record into a FileTiming object */
export function marshallFileTiming(
  input: MarshallFileTimingInput,
  now = new Date()
): MarshallFileTimingOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#branchName = :branchName',
    '#duration = :duration',
    '#filename = :filename',
    '#repoId = :repoId',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi2pk = :gsi2pk',
    '#gsi2sk = :gsi2sk',
    '#lsi1sk = :lsi1sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#branchName': 'branch_name',
    '#duration': 'duration',
    '#filename': 'filename',
    '#repoId': 'repo_id',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi2pk': 'gsi2pk',
    '#gsi2sk': 'gsi2sk',
    '#lsi1sk': 'lsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'FileTiming',
    ':branchName': input.branchName,
    ':duration': input.duration,
    ':filename': input.filename,
    ':repoId': input.repoId,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi2pk': ['BRANCH', input.vendor, input.repoId, input.branchName].join(
      '#'
    ),
    ':gsi2sk': ['FILE'].join('#'),
    ':lsi1sk': ['FILE', input.duration].join('#'),
  };

  if ('label' in input && typeof input.label !== 'undefined') {
    ean['#label'] = 'label';
    eav[':label'] = input.label;
    updateExpression.push('#label = :label');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a FileTiming object */
export function unmarshallFileTiming(item: Record<string, any>): FileTiming {
  let result: FileTiming = {
    branchName: unmarshallRequiredField(item, 'branchName', [
      'branch_name',
      'branchName',
    ]),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    duration: unmarshallRequiredField(item, 'duration', [
      'duration',
      'duration',
    ]),
    filename: unmarshallRequiredField(item, 'filename', [
      'filename',
      'filename',
    ]),
    id: Base64.encode(`FileTiming:${item.pk}#:#${item.sk}`),
    repoId: unmarshallRequiredField(item, 'repoId', ['repo_id', 'repoId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('label' in item || 'label' in item) {
    result = {
      ...result,
      label: unmarshallOptionalField(item, 'label', ['label', 'label']),
    };
  }

  return result;
}

export interface GithubEventPrimaryKey {
  accountId: Scalars['String'];
  action?: Maybe<Scalars['String']>;
  delivery: Scalars['String'];
  event: Scalars['String'];
  vendor: Vendor;
}

export type CreateGithubEventInput = Omit<
  GithubEvent,
  | 'accountId'
  | 'action'
  | 'createdAt'
  | 'id'
  | 'installationId'
  | 'publicId'
  | 'senderId'
  | 'updatedAt'
  | 'version'
>;
export type CreateGithubEventOutput = ResultType<GithubEvent>;
/**  */
export async function createGithubEvent(
  _input: Readonly<CreateGithubEventInput>
): Promise<Readonly<CreateGithubEventOutput>> {
  const tableName = process.env.TABLE_VENDOR_EVENTS;
  assert(tableName, 'TABLE_VENDOR_EVENTS is not set');

  const now = new Date();

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallGithubEventInput = {
    ..._input,
  } as MarshallGithubEventInput;

  let accountIdComputed = false;
  let accountIdComputedValue: GithubEvent['accountId'];
  Object.defineProperty(input, 'accountId', {
    enumerable: true,
    /** getter */
    get() {
      if (!accountIdComputed) {
        accountIdComputed = true;
        accountIdComputedValue = computeGithubEventAccountId(this);
      }
      return accountIdComputedValue;
    },
  });

  let actionComputed = false;
  let actionComputedValue: GithubEvent['action'];
  Object.defineProperty(input, 'action', {
    enumerable: true,
    /** getter */
    get() {
      if (!actionComputed) {
        actionComputed = true;
        actionComputedValue = computeGithubEventAction(this);
      }
      return actionComputedValue;
    },
  });

  let installationIdComputed = false;
  let installationIdComputedValue: GithubEvent['installationId'];
  Object.defineProperty(input, 'installationId', {
    enumerable: true,
    /** getter */
    get() {
      if (!installationIdComputed) {
        installationIdComputed = true;
        installationIdComputedValue = computeGithubEventInstallationId(this);
      }
      return installationIdComputedValue;
    },
  });

  let senderIdComputed = false;
  let senderIdComputedValue: GithubEvent['senderId'];
  Object.defineProperty(input, 'senderId', {
    enumerable: true,
    /** getter */
    get() {
      if (!senderIdComputed) {
        senderIdComputed = true;
        senderIdComputedValue = computeGithubEventSenderId(this);
      }
      return senderIdComputedValue;
    },
  });

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallGithubEvent(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['EVENT', input.vendor, input.accountId].join('#'),
        sk: ['ACTION', input.event, input.action, input.delivery].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'GithubEvent',
      () =>
        new DataIntegrityError(
          `Expected to write GithubEvent but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallGithubEvent(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('GithubEvent', {
        pk: ['EVENT', input.vendor, input.accountId].join('#'),
        sk: ['ACTION', input.event, input.action, input.delivery].join('#'),
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

export type ReadGithubEventOutput = ResultType<GithubEvent>;

/**  */
export async function readGithubEvent(
  input: GithubEventPrimaryKey
): Promise<Readonly<ReadGithubEventOutput>> {
  const tableName = process.env.TABLE_VENDOR_EVENTS;
  assert(tableName, 'TABLE_VENDOR_EVENTS is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['EVENT', input.vendor, input.accountId].join('#'),
      sk: ['ACTION', input.event, input.action, input.delivery].join('#'),
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

    assert(item, () => new NotFoundError('GithubEvent', input));
    assert(
      item._et === 'GithubEvent',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a GithubEvent but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallGithubEvent(item),
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

export type QueryGithubEventInput =
  | {accountId: Scalars['String']; vendor: Vendor}
  | {accountId: Scalars['String']; event: Scalars['String']; vendor: Vendor}
  | {
      accountId: Scalars['String'];
      action?: Maybe<Scalars['String']>;
      event: Scalars['String'];
      vendor: Vendor;
    }
  | {
      accountId: Scalars['String'];
      action?: Maybe<Scalars['String']>;
      delivery: Scalars['String'];
      event: Scalars['String'];
      vendor: Vendor;
    }
  | {index: 'gsi1'; senderId?: Maybe<Scalars['String']>}
  | {
      index: 'gsi1';
      event: Scalars['String'];
      senderId?: Maybe<Scalars['String']>;
    }
  | {
      index: 'gsi1';
      action?: Maybe<Scalars['String']>;
      event: Scalars['String'];
      senderId?: Maybe<Scalars['String']>;
    }
  | {index: 'gsi2'; installationId?: Maybe<Scalars['String']>}
  | {
      index: 'gsi2';
      event: Scalars['String'];
      installationId?: Maybe<Scalars['String']>;
    }
  | {
      index: 'gsi2';
      action?: Maybe<Scalars['String']>;
      event: Scalars['String'];
      installationId?: Maybe<Scalars['String']>;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryGithubEventOutput = MultiResultType<GithubEvent>;

/** helper */
function makeEanForQueryGithubEvent(
  input: QueryGithubEventInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'gsi2') {
      return {'#pk': 'gsi2pk', '#sk': 'gsi2sk'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryGithubEvent(
  input: QueryGithubEventInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['SENDER', input.senderId].join('#'),
        ':sk': makeSortKeyForQuery('EVENT_ACTION', ['event', 'action'], input),
      };
    } else if (input.index === 'gsi2') {
      return {
        ':pk': ['INSTALLATION', input.installationId].join('#'),
        ':sk': makeSortKeyForQuery('EVENT_ACTION', ['event', 'action'], input),
      };
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['EVENT', input.vendor, input.accountId].join('#'),
      ':sk': makeSortKeyForQuery(
        'ACTION',
        ['event', 'action', 'delivery'],
        input
      ),
    };
  }
}

/** helper */
function makeKceForQueryGithubEvent(
  input: QueryGithubEventInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'gsi2') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryGithubEvent */
export async function queryGithubEvent(
  input: Readonly<QueryGithubEventInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryGithubEventOutput>> {
  const tableName = process.env.TABLE_VENDOR_EVENTS;
  assert(tableName, 'TABLE_VENDOR_EVENTS is not set');

  const ExpressionAttributeNames = makeEanForQueryGithubEvent(input);
  const ExpressionAttributeValues = makeEavForQueryGithubEvent(input);
  const KeyConditionExpression = makeKceForQueryGithubEvent(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'GithubEvent',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only GithubEvent was expected.`
            )
        );
        return unmarshallGithubEvent(item);
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

/** queries the GithubEvent table by primary key using a node id */
export async function queryGithubEventByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<GithubEvent>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryGithubEventInput = {
    vendor: primaryKeyValues[1] as Vendor,
    accountId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.event = primaryKeyValues[5];
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.action = primaryKeyValues[6];
  }

  if (typeof primaryKeyValues[4] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.delivery = primaryKeyValues[7];
  }

  const {capacity, items} = await queryGithubEvent(primaryKey);

  assert(items.length > 0, () => new NotFoundError('GithubEvent', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple GithubEvent with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the GithubEvent table by primary key using a node id */
export async function queryGithubEventByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<GithubEvent>, 'metrics'>>> {
  const {capacity, items} = await queryGithubEvent({
    index: 'publicId',
    publicId,
  });

  assert(items.length > 0, () => new NotFoundError('GithubEvent', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple GithubEvent with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallGithubEventOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallGithubEventInput = Required<
  Pick<GithubEvent, 'accountId' | 'delivery' | 'event' | 'payload' | 'vendor'>
> &
  Partial<
    Pick<GithubEvent, 'action' | 'installationId' | 'senderId' | 'version'>
  >;

/** Marshalls a DynamoDB record into a GithubEvent object */
export function marshallGithubEvent(
  input: MarshallGithubEventInput,
  now = new Date()
): MarshallGithubEventOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#accountId = :accountId',
    '#delivery = :delivery',
    '#event = :event',
    '#payload = :payload',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
    '#gsi2pk = :gsi2pk',
    '#gsi2sk = :gsi2sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#accountId': 'accountId',
    '#delivery': 'delivery',
    '#event': 'event',
    '#payload': 'payload',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
    '#gsi2pk': 'gsi2pk',
    '#gsi2sk': 'gsi2sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'GithubEvent',
    ':accountId': input.accountId,
    ':delivery': input.delivery,
    ':event': input.event,
    ':payload': input.payload,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': ['SENDER', input.senderId].join('#'),
    ':gsi1sk': ['EVENT_ACTION', input.event, input.action].join('#'),
    ':gsi2pk': ['INSTALLATION', input.installationId].join('#'),
    ':gsi2sk': ['EVENT_ACTION', input.event, input.action].join('#'),
  };

  if ('action' in input && typeof input.action !== 'undefined') {
    ean['#action'] = 'action';
    eav[':action'] = input.action;
    updateExpression.push('#action = :action');
  }

  if (
    'installationId' in input &&
    typeof input.installationId !== 'undefined'
  ) {
    ean['#installationId'] = 'installationId';
    eav[':installationId'] = input.installationId;
    updateExpression.push('#installationId = :installationId');
  }

  if ('senderId' in input && typeof input.senderId !== 'undefined') {
    ean['#senderId'] = 'senderId';
    eav[':senderId'] = input.senderId;
    updateExpression.push('#senderId = :senderId');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a GithubEvent object */
export function unmarshallGithubEvent(item: Record<string, any>): GithubEvent {
  let result: GithubEvent = {
    accountId: unmarshallRequiredField(item, 'accountId', [
      'accountId',
      'account_id',
    ]),
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    delivery: unmarshallRequiredField(item, 'delivery', [
      'delivery',
      'delivery',
    ]),
    event: unmarshallRequiredField(item, 'event', ['event', 'event']),
    id: Base64.encode(`GithubEvent:${item.pk}#:#${item.sk}`),
    payload: unmarshallRequiredField(item, 'payload', ['payload', 'payload']),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('action' in item || 'action' in item) {
    result = {
      ...result,
      action: unmarshallOptionalField(item, 'action', ['action', 'action']),
    };
  }
  if ('installationId' in item || 'installation_id' in item) {
    result = {
      ...result,
      installationId: unmarshallOptionalField(item, 'installationId', [
        'installationId',
        'installation_id',
      ]),
    };
  }
  if ('senderId' in item || 'sender_id' in item) {
    result = {
      ...result,
      senderId: unmarshallOptionalField(item, 'senderId', [
        'senderId',
        'sender_id',
      ]),
    };
  }

  let accountIdComputed = false;
  const accountIdDatabaseValue = unmarshallRequiredField(item, 'accountId', [
    'accountId',
    'account_id',
  ]);
  let accountIdComputedValue: GithubEvent['accountId'];
  Object.defineProperty(result, 'accountId', {
    enumerable: true,
    /** getter */
    get() {
      if (!accountIdComputed) {
        accountIdComputed = true;
        if (typeof accountIdDatabaseValue !== 'undefined') {
          accountIdComputedValue = accountIdDatabaseValue;
        } else {
          accountIdComputedValue = computeGithubEventAccountId(this);
        }
      }
      return accountIdComputedValue;
    },
  });

  let actionComputed = false;
  const actionDatabaseValue = unmarshallOptionalField(item, 'action', [
    'action',
    'action',
  ]);
  let actionComputedValue: GithubEvent['action'];
  Object.defineProperty(result, 'action', {
    enumerable: true,
    /** getter */
    get() {
      if (!actionComputed) {
        actionComputed = true;
        if (typeof actionDatabaseValue !== 'undefined') {
          actionComputedValue = actionDatabaseValue;
        } else {
          actionComputedValue = computeGithubEventAction(this);
        }
      }
      return actionComputedValue;
    },
  });

  let installationIdComputed = false;
  const installationIdDatabaseValue = unmarshallOptionalField(
    item,
    'installationId',
    ['installationId', 'installation_id']
  );
  let installationIdComputedValue: GithubEvent['installationId'];
  Object.defineProperty(result, 'installationId', {
    enumerable: true,
    /** getter */
    get() {
      if (!installationIdComputed) {
        installationIdComputed = true;
        if (typeof installationIdDatabaseValue !== 'undefined') {
          installationIdComputedValue = installationIdDatabaseValue;
        } else {
          installationIdComputedValue = computeGithubEventInstallationId(this);
        }
      }
      return installationIdComputedValue;
    },
  });

  let senderIdComputed = false;
  const senderIdDatabaseValue = unmarshallOptionalField(item, 'senderId', [
    'senderId',
    'sender_id',
  ]);
  let senderIdComputedValue: GithubEvent['senderId'];
  Object.defineProperty(result, 'senderId', {
    enumerable: true,
    /** getter */
    get() {
      if (!senderIdComputed) {
        senderIdComputed = true;
        if (typeof senderIdDatabaseValue !== 'undefined') {
          senderIdComputedValue = senderIdDatabaseValue;
        } else {
          senderIdComputedValue = computeGithubEventSenderId(this);
        }
      }
      return senderIdComputedValue;
    },
  });

  return result;
}

export interface RepositoryPrimaryKey {
  externalId: Scalars['String'];
  vendor: Vendor;
}

export type CreateRepositoryInput = Omit<
  Repository,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateRepositoryOutput = ResultType<Repository>;
/**  */
export async function createRepository(
  input: Readonly<CreateRepositoryInput>
): Promise<Readonly<CreateRepositoryOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallRepository(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: 'REPOSITORY#0',
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'Repository',
      () =>
        new DataIntegrityError(
          `Expected to write Repository but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepository(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('Repository', {
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: 'REPOSITORY#0',
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

export type BlindWriteRepositoryInput = Omit<
  Repository,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<Repository, 'createdAt'>>;

export type BlindWriteRepositoryOutput = ResultType<Repository>;
/** */
export async function blindWriteRepository(
  input: Readonly<BlindWriteRepositoryInput>
): Promise<Readonly<BlindWriteRepositoryOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallRepository(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
      sk: 'REPOSITORY#0',
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
      item._et === 'Repository',
      () =>
        new DataIntegrityError(
          `Expected to write Repository but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepository(item),
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

export type DeleteRepositoryOutput = ResultType<void>;

/**  */
export async function deleteRepository(
  input: RepositoryPrimaryKey
): Promise<DeleteRepositoryOutput> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: 'REPOSITORY#0',
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
      throw new NotFoundError('Repository', input);
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

export type ReadRepositoryOutput = ResultType<Repository>;

/**  */
export async function readRepository(
  input: RepositoryPrimaryKey
): Promise<Readonly<ReadRepositoryOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
      sk: 'REPOSITORY#0',
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

    assert(item, () => new NotFoundError('Repository', input));
    assert(
      item._et === 'Repository',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a Repository but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepository(item),
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

export type UpdateRepositoryInput = Omit<
  Repository,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateRepositoryOutput = ResultType<Repository>;

/**  */
export async function updateRepository(
  input: Readonly<UpdateRepositoryInput>
): Promise<Readonly<UpdateRepositoryOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallRepository(input);
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
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: 'REPOSITORY#0',
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
      item._et === 'Repository',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            externalId: input.externalId,
            vendor: input.vendor,
          })} to update a Repository but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepository(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readRepository(input);
      } catch {
        throw new NotFoundError('Repository', {
          externalId: input.externalId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('Repository', {
        externalId: input.externalId,
        vendor: input.vendor,
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

export type QueryRepositoryInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {index: 'gsi1'; organization: Scalars['String']; vendor: Vendor}
  | {
      index: 'gsi1';
      organization: Scalars['String'];
      repository?: Maybe<Scalars['String']>;
      vendor: Vendor;
    }
  | {index: 'token'; token: Scalars['String']}
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryRepositoryOutput = MultiResultType<Repository>;

/** helper */
function makeEanForQueryRepository(
  input: QueryRepositoryInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'token') {
      return {'#pk': 'token'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryRepository(
  input: QueryRepositoryInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['REPOSITORY', input.vendor, input.organization].join('#'),
        ':sk': makeSortKeyForQuery('REPOSITORY', ['repository'], input),
      };
    } else if (input.index === 'token') {
      return {':pk': [input.token].join('#')};
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['REPOSITORY', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('REPOSITORY', [], input),
    };
  }
}

/** helper */
function makeKceForQueryRepository(
  input: QueryRepositoryInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'token') {
      return '#pk = :pk';
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryRepository */
export async function queryRepository(
  input: Readonly<QueryRepositoryInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryRepositoryOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const ExpressionAttributeNames = makeEanForQueryRepository(input);
  const ExpressionAttributeValues = makeEavForQueryRepository(input);
  const KeyConditionExpression = makeKceForQueryRepository(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'Repository',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only Repository was expected.`
            )
        );
        return unmarshallRepository(item);
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

/** queries the Repository table by primary key using a node id */
export async function queryRepositoryByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<Repository>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryRepositoryInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  const {capacity, items} = await queryRepository(primaryKey);

  assert(items.length > 0, () => new NotFoundError('Repository', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple Repository with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the Repository table by primary key using a node id */
export async function queryRepositoryByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<Repository>, 'metrics'>>> {
  const {capacity, items} = await queryRepository({
    index: 'publicId',
    publicId,
  });

  assert(items.length > 0, () => new NotFoundError('Repository', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple Repository with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallRepositoryOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallRepositoryInput = Required<
  Pick<
    Repository,
    | 'externalAccountId'
    | 'externalId'
    | 'externalInstallationId'
    | 'organization'
    | 'token'
    | 'vendor'
  >
> &
  Partial<
    Pick<
      Repository,
      | 'count'
      | 'countThisMonth'
      | 'defaultBranchName'
      | 'fileCount'
      | 'fileCountThisMonth'
      | 'lastSeenUserAgent'
      | 'lastSubmissionDate'
      | 'private'
      | 'repository'
      | 'size'
      | 'sizeThisMonth'
      | 'version'
    >
  >;

/** Marshalls a DynamoDB record into a Repository object */
export function marshallRepository(
  input: MarshallRepositoryInput,
  now = new Date()
): MarshallRepositoryOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalAccountId = :externalAccountId',
    '#externalId = :externalId',
    '#externalInstallationId = :externalInstallationId',
    '#organization = :organization',
    '#token = :token',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalAccountId': 'externalAccountId',
    '#externalId': 'externalId',
    '#externalInstallationId': 'externalInstallationId',
    '#organization': 'organization',
    '#token': 'token',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'Repository',
    ':externalAccountId': input.externalAccountId,
    ':externalId': input.externalId,
    ':externalInstallationId': input.externalInstallationId,
    ':organization': input.organization,
    ':token': input.token,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': ['REPOSITORY', input.vendor, input.organization].join('#'),
    ':gsi1sk': ['REPOSITORY', input.repository].join('#'),
  };

  if ('count' in input && typeof input.count !== 'undefined') {
    ean['#count'] = 'count';
    eav[':count'] = input.count;
    updateExpression.push('#count = :count');
  }

  if (
    'countThisMonth' in input &&
    typeof input.countThisMonth !== 'undefined'
  ) {
    ean['#countThisMonth'] = 'countThisMonth';
    eav[':countThisMonth'] = input.countThisMonth;
    updateExpression.push('#countThisMonth = :countThisMonth');
  }

  if (
    'defaultBranchName' in input &&
    typeof input.defaultBranchName !== 'undefined'
  ) {
    ean['#defaultBranchName'] = 'defaultBranchName';
    eav[':defaultBranchName'] = input.defaultBranchName;
    updateExpression.push('#defaultBranchName = :defaultBranchName');
  }

  if ('fileCount' in input && typeof input.fileCount !== 'undefined') {
    ean['#fileCount'] = 'fileCount';
    eav[':fileCount'] = input.fileCount;
    updateExpression.push('#fileCount = :fileCount');
  }

  if (
    'fileCountThisMonth' in input &&
    typeof input.fileCountThisMonth !== 'undefined'
  ) {
    ean['#fileCountThisMonth'] = 'fileCountThisMonth';
    eav[':fileCountThisMonth'] = input.fileCountThisMonth;
    updateExpression.push('#fileCountThisMonth = :fileCountThisMonth');
  }

  if (
    'lastSeenUserAgent' in input &&
    typeof input.lastSeenUserAgent !== 'undefined'
  ) {
    ean['#lastSeenUserAgent'] = 'lastSeenUserAgent';
    eav[':lastSeenUserAgent'] = input.lastSeenUserAgent;
    updateExpression.push('#lastSeenUserAgent = :lastSeenUserAgent');
  }

  if (
    'lastSubmissionDate' in input &&
    typeof input.lastSubmissionDate !== 'undefined'
  ) {
    ean['#lastSubmissionDate'] = 'lastSubmissionDate';
    eav[':lastSubmissionDate'] =
      input.lastSubmissionDate === null
        ? null
        : input.lastSubmissionDate.toISOString();
    updateExpression.push('#lastSubmissionDate = :lastSubmissionDate');
  }

  if ('private' in input && typeof input.private !== 'undefined') {
    ean['#private'] = 'private';
    eav[':private'] = input.private;
    updateExpression.push('#private = :private');
  }

  if ('repository' in input && typeof input.repository !== 'undefined') {
    ean['#repository'] = 'repository';
    eav[':repository'] = input.repository;
    updateExpression.push('#repository = :repository');
  }

  if ('size' in input && typeof input.size !== 'undefined') {
    ean['#size'] = 'size';
    eav[':size'] = input.size;
    updateExpression.push('#size = :size');
  }

  if ('sizeThisMonth' in input && typeof input.sizeThisMonth !== 'undefined') {
    ean['#sizeThisMonth'] = 'sizeThisMonth';
    eav[':sizeThisMonth'] = input.sizeThisMonth;
    updateExpression.push('#sizeThisMonth = :sizeThisMonth');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a Repository object */
export function unmarshallRepository(item: Record<string, any>): Repository {
  let result: Repository = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalAccountId: unmarshallRequiredField(item, 'externalAccountId', [
      'externalAccountId',
      'external_account_id',
    ]),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    externalInstallationId: unmarshallRequiredField(
      item,
      'externalInstallationId',
      ['externalInstallationId', 'external_installation_id']
    ),
    id: Base64.encode(`Repository:${item.pk}#:#${item.sk}`),
    organization: unmarshallRequiredField(item, 'organization', [
      'organization',
      'organization',
    ]),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    token: unmarshallRequiredField(item, 'token', ['token', 'token']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('count' in item || 'count' in item) {
    result = {
      ...result,
      count: unmarshallOptionalField(item, 'count', ['count', 'count']),
    };
  }
  if ('countThisMonth' in item || 'count_this_month' in item) {
    result = {
      ...result,
      countThisMonth: unmarshallOptionalField(item, 'countThisMonth', [
        'countThisMonth',
        'count_this_month',
      ]),
    };
  }
  if ('defaultBranchName' in item || 'default_branch_name' in item) {
    result = {
      ...result,
      defaultBranchName: unmarshallOptionalField(item, 'defaultBranchName', [
        'defaultBranchName',
        'default_branch_name',
      ]),
    };
  }
  if ('fileCount' in item || 'file_count' in item) {
    result = {
      ...result,
      fileCount: unmarshallOptionalField(item, 'fileCount', [
        'fileCount',
        'file_count',
      ]),
    };
  }
  if ('fileCountThisMonth' in item || 'file_count_this_month' in item) {
    result = {
      ...result,
      fileCountThisMonth: unmarshallOptionalField(item, 'fileCountThisMonth', [
        'fileCountThisMonth',
        'file_count_this_month',
      ]),
    };
  }
  if ('lastSeenUserAgent' in item || 'last_seen_user_agent' in item) {
    result = {
      ...result,
      lastSeenUserAgent: unmarshallOptionalField(item, 'lastSeenUserAgent', [
        'lastSeenUserAgent',
        'last_seen_user_agent',
      ]),
    };
  }
  if (
    ('lastSubmissionDate' in item && item.lastSubmissionDate !== null) ||
    ('last_submission_date' in item && item.last_submission_date !== null)
  ) {
    result = {
      ...result,
      lastSubmissionDate: unmarshallOptionalField(
        item,
        'lastSubmissionDate',
        ['lastSubmissionDate', 'last_submission_date'],
        (v) => new Date(v)
      ),
    };
  }
  if ('private' in item || 'private' in item) {
    result = {
      ...result,
      private: unmarshallOptionalField(item, 'private', ['private', 'private']),
    };
  }
  if ('repository' in item || 'repository' in item) {
    result = {
      ...result,
      repository: unmarshallOptionalField(item, 'repository', [
        'repository',
        'repository',
      ]),
    };
  }
  if ('size' in item || 'size' in item) {
    result = {
      ...result,
      size: unmarshallOptionalField(item, 'size', ['size', 'size']),
    };
  }
  if ('sizeThisMonth' in item || 'size_this_month' in item) {
    result = {
      ...result,
      sizeThisMonth: unmarshallOptionalField(item, 'sizeThisMonth', [
        'sizeThisMonth',
        'size_this_month',
      ]),
    };
  }

  return result;
}

export interface RepositoryLabelPrimaryKey {
  externalId: Scalars['String'];
  label: Scalars['String'];
  vendor: Vendor;
}

export type CreateRepositoryLabelInput = Omit<
  RepositoryLabel,
  'createdAt' | 'id' | 'updatedAt' | 'version'
>;
export type CreateRepositoryLabelOutput = ResultType<RepositoryLabel>;
/**  */
export async function createRepositoryLabel(
  input: Readonly<CreateRepositoryLabelInput>
): Promise<Readonly<CreateRepositoryLabelOutput>> {
  const tableName = process.env.TABLE_REPOSITORY_LABEL;
  assert(tableName, 'TABLE_REPOSITORY_LABEL is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallRepositoryLabel(input, now);

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
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: ['LABEL', input.label].join('#'),
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
      item._et === 'RepositoryLabel',
      () =>
        new DataIntegrityError(
          `Expected to write RepositoryLabel but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepositoryLabel(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('RepositoryLabel', {
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: ['LABEL', input.label].join('#'),
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

export type BlindWriteRepositoryLabelInput = Omit<
  RepositoryLabel,
  'createdAt' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<RepositoryLabel, 'createdAt'>>;

export type BlindWriteRepositoryLabelOutput = ResultType<RepositoryLabel>;
/** */
export async function blindWriteRepositoryLabel(
  input: Readonly<BlindWriteRepositoryLabelInput>
): Promise<Readonly<BlindWriteRepositoryLabelOutput>> {
  const tableName = process.env.TABLE_REPOSITORY_LABEL;
  assert(tableName, 'TABLE_REPOSITORY_LABEL is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallRepositoryLabel(input, now);

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
      pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
      sk: ['LABEL', input.label].join('#'),
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
      item._et === 'RepositoryLabel',
      () =>
        new DataIntegrityError(
          `Expected to write RepositoryLabel but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepositoryLabel(item),
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

export type DeleteRepositoryLabelOutput = ResultType<void>;

/**  */
export async function deleteRepositoryLabel(
  input: RepositoryLabelPrimaryKey
): Promise<DeleteRepositoryLabelOutput> {
  const tableName = process.env.TABLE_REPOSITORY_LABEL;
  assert(tableName, 'TABLE_REPOSITORY_LABEL is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: ['LABEL', input.label].join('#'),
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
      throw new NotFoundError('RepositoryLabel', input);
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

export type ReadRepositoryLabelOutput = ResultType<RepositoryLabel>;

/**  */
export async function readRepositoryLabel(
  input: RepositoryLabelPrimaryKey
): Promise<Readonly<ReadRepositoryLabelOutput>> {
  const tableName = process.env.TABLE_REPOSITORY_LABEL;
  assert(tableName, 'TABLE_REPOSITORY_LABEL is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
      sk: ['LABEL', input.label].join('#'),
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

    assert(item, () => new NotFoundError('RepositoryLabel', input));
    assert(
      item._et === 'RepositoryLabel',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a RepositoryLabel but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepositoryLabel(item),
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

export type UpdateRepositoryLabelInput = Omit<
  RepositoryLabel,
  'createdAt' | 'id' | 'updatedAt'
>;
export type UpdateRepositoryLabelOutput = ResultType<RepositoryLabel>;

/**  */
export async function updateRepositoryLabel(
  input: Readonly<UpdateRepositoryLabelInput>
): Promise<Readonly<UpdateRepositoryLabelOutput>> {
  const tableName = process.env.TABLE_REPOSITORY_LABEL;
  assert(tableName, 'TABLE_REPOSITORY_LABEL is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallRepositoryLabel(input);
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
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: ['LABEL', input.label].join('#'),
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
      item._et === 'RepositoryLabel',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            externalId: input.externalId,
            label: input.label,
            vendor: input.vendor,
          })} to update a RepositoryLabel but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepositoryLabel(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readRepositoryLabel(input);
      } catch {
        throw new NotFoundError('RepositoryLabel', {
          externalId: input.externalId,
          label: input.label,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('RepositoryLabel', {
        externalId: input.externalId,
        label: input.label,
        vendor: input.vendor,
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

export type QueryRepositoryLabelInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; label: Scalars['String']; vendor: Vendor};
export type QueryRepositoryLabelOutput = MultiResultType<RepositoryLabel>;

/** helper */
function makeEanForQueryRepositoryLabel(
  input: QueryRepositoryLabelInput
): Record<string, string> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryRepositoryLabel(
  input: QueryRepositoryLabelInput
): Record<string, any> {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['REPOSITORY', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('LABEL', ['label'], input),
    };
  }
}

/** helper */
function makeKceForQueryRepositoryLabel(
  input: QueryRepositoryLabelInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryRepositoryLabel */
export async function queryRepositoryLabel(
  input: Readonly<QueryRepositoryLabelInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryRepositoryLabelOutput>> {
  const tableName = process.env.TABLE_REPOSITORY_LABEL;
  assert(tableName, 'TABLE_REPOSITORY_LABEL is not set');

  const ExpressionAttributeNames = makeEanForQueryRepositoryLabel(input);
  const ExpressionAttributeValues = makeEavForQueryRepositoryLabel(input);
  const KeyConditionExpression = makeKceForQueryRepositoryLabel(input, {
    operator,
  });

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'RepositoryLabel',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only RepositoryLabel was expected.`
            )
        );
        return unmarshallRepositoryLabel(item);
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

/** queries the RepositoryLabel table by primary key using a node id */
export async function queryRepositoryLabelByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<RepositoryLabel>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryRepositoryLabelInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.label = primaryKeyValues[5];
  }

  const {capacity, items} = await queryRepositoryLabel(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('RepositoryLabel', primaryKey)
  );
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple RepositoryLabel with id ${id}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallRepositoryLabelOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallRepositoryLabelInput = Required<
  Pick<RepositoryLabel, 'externalId' | 'label' | 'vendor'>
> &
  Partial<Pick<RepositoryLabel, 'duration' | 'stability' | 'version'>>;

/** Marshalls a DynamoDB record into a RepositoryLabel object */
export function marshallRepositoryLabel(
  input: MarshallRepositoryLabelInput,
  now = new Date()
): MarshallRepositoryLabelOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#label = :label',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'external_id',
    '#label': 'label',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'RepositoryLabel',
    ':externalId': input.externalId,
    ':label': input.label,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  if ('duration' in input && typeof input.duration !== 'undefined') {
    ean['#duration'] = 'duration';
    eav[':duration'] = input.duration;
    updateExpression.push('#duration = :duration');
  }

  if ('stability' in input && typeof input.stability !== 'undefined') {
    ean['#stability'] = 'stability';
    eav[':stability'] = input.stability;
    updateExpression.push('#stability = :stability');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a RepositoryLabel object */
export function unmarshallRepositoryLabel(
  item: Record<string, any>
): RepositoryLabel {
  let result: RepositoryLabel = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'external_id',
      'externalId',
    ]),
    id: Base64.encode(`RepositoryLabel:${item.pk}#:#${item.sk}`),
    label: unmarshallRequiredField(item, 'label', ['label', 'label']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('duration' in item || 'duration' in item) {
    result = {
      ...result,
      duration: unmarshallOptionalField(item, 'duration', [
        'duration',
        'duration',
      ]),
    };
  }
  if ('stability' in item || 'stability' in item) {
    result = {
      ...result,
      stability: unmarshallOptionalField(item, 'stability', [
        'stability',
        'stability',
      ]),
    };
  }

  return result;
}

export interface RepositorySubmissionEventPrimaryKey {
  createdAt: Scalars['Date'];
  externalId: Scalars['String'];
  publicId: Scalars['String'];
  vendor: Vendor;
}

export type CreateRepositorySubmissionEventInput = Omit<
  RepositorySubmissionEvent,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateRepositorySubmissionEventOutput =
  ResultType<RepositorySubmissionEvent>;
/**  */
export async function createRepositorySubmissionEvent(
  input: Readonly<CreateRepositorySubmissionEventInput>
): Promise<Readonly<CreateRepositorySubmissionEventOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallRepositorySubmissionEvent(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: ['REPOSITORY', now.getTime(), publicId].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'RepositorySubmissionEvent',
      () =>
        new DataIntegrityError(
          `Expected to write RepositorySubmissionEvent but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepositorySubmissionEvent(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('RepositorySubmissionEvent', {
        pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
        sk: ['REPOSITORY', now.getTime(), publicId].join('#'),
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

export type ReadRepositorySubmissionEventOutput =
  ResultType<RepositorySubmissionEvent>;

/**  */
export async function readRepositorySubmissionEvent(
  input: RepositorySubmissionEventPrimaryKey
): Promise<Readonly<ReadRepositorySubmissionEventOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['REPOSITORY', input.vendor, input.externalId].join('#'),
      sk: ['REPOSITORY', input.createdAt.getTime(), input.publicId].join('#'),
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

    assert(item, () => new NotFoundError('RepositorySubmissionEvent', input));
    assert(
      item._et === 'RepositorySubmissionEvent',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a RepositorySubmissionEvent but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallRepositorySubmissionEvent(item),
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

export type QueryRepositorySubmissionEventInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {createdAt: Scalars['Date']; externalId: Scalars['String']; vendor: Vendor}
  | {
      createdAt: Scalars['Date'];
      externalId: Scalars['String'];
      publicId: Scalars['String'];
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryRepositorySubmissionEventOutput =
  MultiResultType<RepositorySubmissionEvent>;

/** helper */
function makeEanForQueryRepositorySubmissionEvent(
  input: QueryRepositorySubmissionEventInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryRepositorySubmissionEvent(
  input: QueryRepositorySubmissionEventInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['REPOSITORY', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery(
        'REPOSITORY',
        ['createdAt', 'publicId'],
        input
      ),
    };
  }
}

/** helper */
function makeKceForQueryRepositorySubmissionEvent(
  input: QueryRepositorySubmissionEventInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryRepositorySubmissionEvent */
export async function queryRepositorySubmissionEvent(
  input: Readonly<QueryRepositorySubmissionEventInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryRepositorySubmissionEventOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const ExpressionAttributeNames =
    makeEanForQueryRepositorySubmissionEvent(input);
  const ExpressionAttributeValues =
    makeEavForQueryRepositorySubmissionEvent(input);
  const KeyConditionExpression = makeKceForQueryRepositorySubmissionEvent(
    input,
    {operator}
  );

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'RepositorySubmissionEvent',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only RepositorySubmissionEvent was expected.`
            )
        );
        return unmarshallRepositorySubmissionEvent(item);
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

/** queries the RepositorySubmissionEvent table by primary key using a node id */
export async function queryRepositorySubmissionEventByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<RepositorySubmissionEvent>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryRepositorySubmissionEventInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.createdAt = new Date(primaryKeyValues[5]);
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.publicId = primaryKeyValues[6];
  }

  const {capacity, items} = await queryRepositorySubmissionEvent(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('RepositorySubmissionEvent', primaryKey)
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple RepositorySubmissionEvent with id ${id}`
      )
  );

  return {capacity, item: items[0]};
}

/** queries the RepositorySubmissionEvent table by primary key using a node id */
export async function queryRepositorySubmissionEventByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<RepositorySubmissionEvent>, 'metrics'>>> {
  const {capacity, items} = await queryRepositorySubmissionEvent({
    index: 'publicId',
    publicId,
  });

  assert(
    items.length > 0,
    () => new NotFoundError('RepositorySubmissionEvent', {publicId})
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple RepositorySubmissionEvent with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallRepositorySubmissionEventOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallRepositorySubmissionEventInput = Required<
  Pick<
    RepositorySubmissionEvent,
    'externalAccountId' | 'externalId' | 'fileCount' | 'sha' | 'size' | 'vendor'
  >
> &
  Partial<Pick<RepositorySubmissionEvent, 'label' | 'userAgent' | 'version'>>;

/** Marshalls a DynamoDB record into a RepositorySubmissionEvent object */
export function marshallRepositorySubmissionEvent(
  input: MarshallRepositorySubmissionEventInput,
  now = new Date()
): MarshallRepositorySubmissionEventOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalAccountId = :externalAccountId',
    '#externalId = :externalId',
    '#fileCount = :fileCount',
    '#sha = :sha',
    '#size = :size',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalAccountId': 'externalAccountId',
    '#externalId': 'externalId',
    '#fileCount': 'fileCount',
    '#sha': 'sha',
    '#size': 'size',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'RepositorySubmissionEvent',
    ':externalAccountId': input.externalAccountId,
    ':externalId': input.externalId,
    ':fileCount': input.fileCount,
    ':sha': input.sha,
    ':size': input.size,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  if ('label' in input && typeof input.label !== 'undefined') {
    ean['#label'] = 'label';
    eav[':label'] = input.label;
    updateExpression.push('#label = :label');
  }

  if ('userAgent' in input && typeof input.userAgent !== 'undefined') {
    ean['#userAgent'] = 'userAgent';
    eav[':userAgent'] = input.userAgent;
    updateExpression.push('#userAgent = :userAgent');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a RepositorySubmissionEvent object */
export function unmarshallRepositorySubmissionEvent(
  item: Record<string, any>
): RepositorySubmissionEvent {
  let result: RepositorySubmissionEvent = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalAccountId: unmarshallRequiredField(item, 'externalAccountId', [
      'externalAccountId',
      'external_account_id',
    ]),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    fileCount: unmarshallRequiredField(item, 'fileCount', [
      'fileCount',
      'file_count',
    ]),
    id: Base64.encode(`RepositorySubmissionEvent:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    sha: unmarshallRequiredField(item, 'sha', ['sha', 'sha']),
    size: unmarshallRequiredField(item, 'size', ['size', 'size']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('label' in item || 'label' in item) {
    result = {
      ...result,
      label: unmarshallOptionalField(item, 'label', ['label', 'label']),
    };
  }
  if ('userAgent' in item || 'user_agent' in item) {
    result = {
      ...result,
      userAgent: unmarshallOptionalField(item, 'userAgent', [
        'userAgent',
        'user_agent',
      ]),
    };
  }

  return result;
}

export interface ScheduledEmailPrimaryKey {
  externalId: Scalars['String'];
  template: EmailTemplate;
  vendor: Vendor;
}

export type CreateScheduledEmailInput = Omit<
  ScheduledEmail,
  'createdAt' | 'id' | 'publicId' | 'ttl' | 'updatedAt' | 'version'
> &
  Partial<Pick<ScheduledEmail, 'ttl'>>;
export type CreateScheduledEmailOutput = ResultType<ScheduledEmail>;
/**  */
export async function createScheduledEmail(
  input: Readonly<CreateScheduledEmailInput>
): Promise<Readonly<CreateScheduledEmailOutput>> {
  const tableName = process.env.TABLE_EMAIL;
  assert(tableName, 'TABLE_EMAIL is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallScheduledEmail(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['SCHEDULED_EMAIL', input.template].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'ScheduledEmail',
      () =>
        new DataIntegrityError(
          `Expected to write ScheduledEmail but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallScheduledEmail(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('ScheduledEmail', {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['SCHEDULED_EMAIL', input.template].join('#'),
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

export type ReadScheduledEmailOutput = ResultType<ScheduledEmail>;

/**  */
export async function readScheduledEmail(
  input: ScheduledEmailPrimaryKey
): Promise<Readonly<ReadScheduledEmailOutput>> {
  const tableName = process.env.TABLE_EMAIL;
  assert(tableName, 'TABLE_EMAIL is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: ['SCHEDULED_EMAIL', input.template].join('#'),
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

    assert(item, () => new NotFoundError('ScheduledEmail', input));
    assert(
      item._et === 'ScheduledEmail',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a ScheduledEmail but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallScheduledEmail(item),
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

export type QueryScheduledEmailInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; template: EmailTemplate; vendor: Vendor}
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryScheduledEmailOutput = MultiResultType<ScheduledEmail>;

/** helper */
function makeEanForQueryScheduledEmail(
  input: QueryScheduledEmailInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryScheduledEmail(
  input: QueryScheduledEmailInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('SCHEDULED_EMAIL', ['template'], input),
    };
  }
}

/** helper */
function makeKceForQueryScheduledEmail(
  input: QueryScheduledEmailInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryScheduledEmail */
export async function queryScheduledEmail(
  input: Readonly<QueryScheduledEmailInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryScheduledEmailOutput>> {
  const tableName = process.env.TABLE_EMAIL;
  assert(tableName, 'TABLE_EMAIL is not set');

  const ExpressionAttributeNames = makeEanForQueryScheduledEmail(input);
  const ExpressionAttributeValues = makeEavForQueryScheduledEmail(input);
  const KeyConditionExpression = makeKceForQueryScheduledEmail(input, {
    operator,
  });

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'ScheduledEmail',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only ScheduledEmail was expected.`
            )
        );
        return unmarshallScheduledEmail(item);
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

/** queries the ScheduledEmail table by primary key using a node id */
export async function queryScheduledEmailByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<ScheduledEmail>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryScheduledEmailInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.template = primaryKeyValues[5] as EmailTemplate;
  }

  const {capacity, items} = await queryScheduledEmail(primaryKey);

  assert(
    items.length > 0,
    () => new NotFoundError('ScheduledEmail', primaryKey)
  );
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple ScheduledEmail with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the ScheduledEmail table by primary key using a node id */
export async function queryScheduledEmailByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<ScheduledEmail>, 'metrics'>>> {
  const {capacity, items} = await queryScheduledEmail({
    index: 'publicId',
    publicId,
  });

  assert(
    items.length > 0,
    () => new NotFoundError('ScheduledEmail', {publicId})
  );
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple ScheduledEmail with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallScheduledEmailOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallScheduledEmailInput = Required<
  Pick<ScheduledEmail, 'externalId' | 'template' | 'vendor'>
> &
  Partial<Pick<ScheduledEmail, 'ttl' | 'version'>>;

/** Marshalls a DynamoDB record into a ScheduledEmail object */
export function marshallScheduledEmail(
  input: MarshallScheduledEmailInput,
  now = new Date()
): MarshallScheduledEmailOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#template = :template',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'externalId',
    '#template': 'template',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'ScheduledEmail',
    ':externalId': input.externalId,
    ':template': input.template,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  if ('ttl' in input && typeof input.ttl !== 'undefined') {
    assert(
      !Number.isNaN(input.ttl?.getTime()),
      'ttl was passed but is not a valid date'
    );
    ean['#ttl'] = 'ttl';
    eav[':ttl'] =
      input.ttl === null ? null : Math.floor(input.ttl.getTime() / 1000);
    updateExpression.push('#ttl = :ttl');
  }

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a ScheduledEmail object */
export function unmarshallScheduledEmail(
  item: Record<string, any>
): ScheduledEmail {
  let result: ScheduledEmail = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    id: Base64.encode(`ScheduledEmail:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    template: unmarshallRequiredField(item, 'template', [
      'template',
      'template',
    ]),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('ttl' in item && item.ttl !== null) {
    result = {
      ...result,
      ttl: unmarshallOptionalField(
        item,
        'ttl',
        ['ttl'],
        (v) => new Date(v * 1000)
      ),
    };
  }

  return result;
}

export interface SentEmailPrimaryKey {
  createdAt: Scalars['Date'];
  externalId: Scalars['String'];
  template: EmailTemplate;
  vendor: Vendor;
}

export type CreateSentEmailInput = Omit<
  SentEmail,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateSentEmailOutput = ResultType<SentEmail>;
/**  */
export async function createSentEmail(
  input: Readonly<CreateSentEmailInput>
): Promise<Readonly<CreateSentEmailOutput>> {
  const tableName = process.env.TABLE_EMAIL;
  assert(tableName, 'TABLE_EMAIL is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallSentEmail(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['TEMPLATE', input.template, now.getTime()].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'SentEmail',
      () =>
        new DataIntegrityError(
          `Expected to write SentEmail but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallSentEmail(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('SentEmail', {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: ['TEMPLATE', input.template, now.getTime()].join('#'),
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

export type ReadSentEmailOutput = ResultType<SentEmail>;

/**  */
export async function readSentEmail(
  input: SentEmailPrimaryKey
): Promise<Readonly<ReadSentEmailOutput>> {
  const tableName = process.env.TABLE_EMAIL;
  assert(tableName, 'TABLE_EMAIL is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: ['TEMPLATE', input.template, input.createdAt.getTime()].join('#'),
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

    assert(item, () => new NotFoundError('SentEmail', input));
    assert(
      item._et === 'SentEmail',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a SentEmail but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallSentEmail(item),
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

export type QuerySentEmailInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; template: EmailTemplate; vendor: Vendor}
  | {
      createdAt: Scalars['Date'];
      externalId: Scalars['String'];
      template: EmailTemplate;
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QuerySentEmailOutput = MultiResultType<SentEmail>;

/** helper */
function makeEanForQuerySentEmail(
  input: QuerySentEmailInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQuerySentEmail(
  input: QuerySentEmailInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('TEMPLATE', ['template', 'createdAt'], input),
    };
  }
}

/** helper */
function makeKceForQuerySentEmail(
  input: QuerySentEmailInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** querySentEmail */
export async function querySentEmail(
  input: Readonly<QuerySentEmailInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QuerySentEmailOutput>> {
  const tableName = process.env.TABLE_EMAIL;
  assert(tableName, 'TABLE_EMAIL is not set');

  const ExpressionAttributeNames = makeEanForQuerySentEmail(input);
  const ExpressionAttributeValues = makeEavForQuerySentEmail(input);
  const KeyConditionExpression = makeKceForQuerySentEmail(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'SentEmail',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only SentEmail was expected.`
            )
        );
        return unmarshallSentEmail(item);
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

/** queries the SentEmail table by primary key using a node id */
export async function querySentEmailByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<SentEmail>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QuerySentEmailInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.template = primaryKeyValues[5] as EmailTemplate;
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.createdAt = new Date(primaryKeyValues[6]);
  }

  const {capacity, items} = await querySentEmail(primaryKey);

  assert(items.length > 0, () => new NotFoundError('SentEmail', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple SentEmail with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the SentEmail table by primary key using a node id */
export async function querySentEmailByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<SentEmail>, 'metrics'>>> {
  const {capacity, items} = await querySentEmail({index: 'publicId', publicId});

  assert(items.length > 0, () => new NotFoundError('SentEmail', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple SentEmail with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallSentEmailOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallSentEmailInput = Required<
  Pick<SentEmail, 'externalId' | 'messageId' | 'template' | 'vendor'>
> &
  Partial<Pick<SentEmail, 'version'>>;

/** Marshalls a DynamoDB record into a SentEmail object */
export function marshallSentEmail(
  input: MarshallSentEmailInput,
  now = new Date()
): MarshallSentEmailOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#messageId = :messageId',
    '#template = :template',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'externalId',
    '#messageId': 'messageId',
    '#template': 'template',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'SentEmail',
    ':externalId': input.externalId,
    ':messageId': input.messageId,
    ':template': input.template,
    ':vendor': input.vendor,
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

/** Unmarshalls a DynamoDB record into a SentEmail object */
export function unmarshallSentEmail(item: Record<string, any>): SentEmail {
  const result: SentEmail = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    id: Base64.encode(`SentEmail:${item.pk}#:#${item.sk}`),
    messageId: unmarshallRequiredField(item, 'messageId', [
      'messageId',
      'message_id',
    ]),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    template: unmarshallRequiredField(item, 'template', [
      'template',
      'template',
    ]),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface SubscriptionPrimaryKey {
  effectiveDate: Scalars['Date'];
  externalId: Scalars['String'];
  githubEventActionSort: Scalars['String'];
  vendor: Vendor;
}

export type CreateSubscriptionInput = Omit<
  Subscription,
  | 'createdAt'
  | 'githubEventActionSort'
  | 'id'
  | 'publicId'
  | 'updatedAt'
  | 'version'
>;
export type CreateSubscriptionOutput = ResultType<Subscription>;
/**  */
export async function createSubscription(
  _input: Readonly<CreateSubscriptionInput>
): Promise<Readonly<CreateSubscriptionOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const now = new Date();

  // This has to be cast because we're adding computed fields on the next
  // lines.
  const input: MarshallSubscriptionInput = {
    ..._input,
  } as MarshallSubscriptionInput;

  let githubEventActionSortComputed = false;
  let githubEventActionSortComputedValue: Subscription['githubEventActionSort'];
  Object.defineProperty(input, 'githubEventActionSort', {
    enumerable: true,
    /** getter */
    get() {
      if (!githubEventActionSortComputed) {
        githubEventActionSortComputed = true;
        githubEventActionSortComputedValue =
          computeSubscriptionGithubEventActionSort(this);
      }
      return githubEventActionSortComputedValue;
    },
  });

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallSubscription(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: [
          'SUBSCRIPTION_CHANGE',
          input.effectiveDate === null
            ? null
            : input.effectiveDate.toISOString(),
          input.githubEventActionSort,
        ].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'Subscription',
      () =>
        new DataIntegrityError(
          `Expected to write Subscription but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallSubscription(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('Subscription', {
        pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
        sk: [
          'SUBSCRIPTION_CHANGE',
          input.effectiveDate === null
            ? null
            : input.effectiveDate.toISOString(),
          input.githubEventActionSort,
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

export type ReadSubscriptionOutput = ResultType<Subscription>;

/**  */
export async function readSubscription(
  input: SubscriptionPrimaryKey
): Promise<Readonly<ReadSubscriptionOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['ACCOUNT', input.vendor, input.externalId].join('#'),
      sk: [
        'SUBSCRIPTION_CHANGE',
        input.effectiveDate === null ? null : input.effectiveDate.toISOString(),
        input.githubEventActionSort,
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

    assert(item, () => new NotFoundError('Subscription', input));
    assert(
      item._et === 'Subscription',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(
            input
          )} to load a Subscription but loaded ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallSubscription(item),
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

export type QuerySubscriptionInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {
      effectiveDate: Scalars['Date'];
      externalId: Scalars['String'];
      vendor: Vendor;
    }
  | {
      effectiveDate: Scalars['Date'];
      externalId: Scalars['String'];
      githubEventActionSort: Scalars['String'];
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QuerySubscriptionOutput = MultiResultType<Subscription>;

/** helper */
function makeEanForQuerySubscription(
  input: QuerySubscriptionInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQuerySubscription(
  input: QuerySubscriptionInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['ACCOUNT', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery(
        'SUBSCRIPTION_CHANGE',
        ['effectiveDate', 'githubEventActionSort'],
        input
      ),
    };
  }
}

/** helper */
function makeKceForQuerySubscription(
  input: QuerySubscriptionInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** querySubscription */
export async function querySubscription(
  input: Readonly<QuerySubscriptionInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QuerySubscriptionOutput>> {
  const tableName = process.env.TABLE_ACCOUNTS;
  assert(tableName, 'TABLE_ACCOUNTS is not set');

  const ExpressionAttributeNames = makeEanForQuerySubscription(input);
  const ExpressionAttributeValues = makeEavForQuerySubscription(input);
  const KeyConditionExpression = makeKceForQuerySubscription(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'Subscription',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only Subscription was expected.`
            )
        );
        return unmarshallSubscription(item);
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

/** queries the Subscription table by primary key using a node id */
export async function querySubscriptionByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<Subscription>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QuerySubscriptionInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.effectiveDate = new Date(primaryKeyValues[5]);
  }

  if (typeof primaryKeyValues[3] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.githubEventActionSort = primaryKeyValues[6];
  }

  const {capacity, items} = await querySubscription(primaryKey);

  assert(items.length > 0, () => new NotFoundError('Subscription', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple Subscription with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the Subscription table by primary key using a node id */
export async function querySubscriptionByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<Subscription>, 'metrics'>>> {
  const {capacity, items} = await querySubscription({
    index: 'publicId',
    publicId,
  });

  assert(items.length > 0, () => new NotFoundError('Subscription', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple Subscription with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallSubscriptionOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallSubscriptionInput = Required<
  Pick<
    Subscription,
    'effectiveDate' | 'externalId' | 'githubEventActionSort' | 'vendor'
  >
> &
  Partial<
    Pick<
      Subscription,
      | 'billingCycle'
      | 'cancelled'
      | 'freeTrialEndsOn'
      | 'githubEventAction'
      | 'githubEventId'
      | 'marketplacePurchase'
      | 'marketplacePurchaseAction'
      | 'monthlyPriceInCents'
      | 'nextBillingDate'
      | 'onFreeTrial'
      | 'planId'
      | 'planName'
      | 'reason'
      | 'version'
      | 'yearlyPriceInCents'
    >
  >;

/** Marshalls a DynamoDB record into a Subscription object */
export function marshallSubscription(
  input: MarshallSubscriptionInput,
  now = new Date()
): MarshallSubscriptionOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#effectiveDate = :effectiveDate',
    '#externalId = :externalId',
    '#githubEventActionSort = :githubEventActionSort',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#effectiveDate': 'effectiveDate',
    '#externalId': 'externalId',
    '#githubEventActionSort': 'githubEventActionSort',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'Subscription',
    ':effectiveDate':
      input.effectiveDate === null ? null : input.effectiveDate.toISOString(),
    ':externalId': input.externalId,
    ':githubEventActionSort': input.githubEventActionSort,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  if ('billingCycle' in input && typeof input.billingCycle !== 'undefined') {
    ean['#billingCycle'] = 'billingCycle';
    eav[':billingCycle'] = input.billingCycle;
    updateExpression.push('#billingCycle = :billingCycle');
  }

  if ('cancelled' in input && typeof input.cancelled !== 'undefined') {
    ean['#cancelled'] = 'cancelled';
    eav[':cancelled'] = input.cancelled;
    updateExpression.push('#cancelled = :cancelled');
  }

  if (
    'freeTrialEndsOn' in input &&
    typeof input.freeTrialEndsOn !== 'undefined'
  ) {
    ean['#freeTrialEndsOn'] = 'freeTrialEndsOn';
    eav[':freeTrialEndsOn'] =
      input.freeTrialEndsOn === null
        ? null
        : input.freeTrialEndsOn.toISOString();
    updateExpression.push('#freeTrialEndsOn = :freeTrialEndsOn');
  }

  if (
    'githubEventAction' in input &&
    typeof input.githubEventAction !== 'undefined'
  ) {
    ean['#githubEventAction'] = 'githubEventAction';
    eav[':githubEventAction'] = input.githubEventAction;
    updateExpression.push('#githubEventAction = :githubEventAction');
  }

  if ('githubEventId' in input && typeof input.githubEventId !== 'undefined') {
    ean['#githubEventId'] = 'githubEventId';
    eav[':githubEventId'] = input.githubEventId;
    updateExpression.push('#githubEventId = :githubEventId');
  }

  if (
    'marketplacePurchase' in input &&
    typeof input.marketplacePurchase !== 'undefined'
  ) {
    ean['#marketplacePurchase'] = 'marketplacePurchase';
    eav[':marketplacePurchase'] = input.marketplacePurchase;
    updateExpression.push('#marketplacePurchase = :marketplacePurchase');
  }

  if (
    'marketplacePurchaseAction' in input &&
    typeof input.marketplacePurchaseAction !== 'undefined'
  ) {
    ean['#marketplacePurchaseAction'] = 'marketplacePurchaseAction';
    eav[':marketplacePurchaseAction'] = input.marketplacePurchaseAction;
    updateExpression.push(
      '#marketplacePurchaseAction = :marketplacePurchaseAction'
    );
  }

  if (
    'monthlyPriceInCents' in input &&
    typeof input.monthlyPriceInCents !== 'undefined'
  ) {
    ean['#monthlyPriceInCents'] = 'monthlyPriceInCents';
    eav[':monthlyPriceInCents'] = input.monthlyPriceInCents;
    updateExpression.push('#monthlyPriceInCents = :monthlyPriceInCents');
  }

  if (
    'nextBillingDate' in input &&
    typeof input.nextBillingDate !== 'undefined'
  ) {
    ean['#nextBillingDate'] = 'nextBillingDate';
    eav[':nextBillingDate'] =
      input.nextBillingDate === null
        ? null
        : input.nextBillingDate.toISOString();
    updateExpression.push('#nextBillingDate = :nextBillingDate');
  }

  if ('onFreeTrial' in input && typeof input.onFreeTrial !== 'undefined') {
    ean['#onFreeTrial'] = 'onFreeTrial';
    eav[':onFreeTrial'] = input.onFreeTrial;
    updateExpression.push('#onFreeTrial = :onFreeTrial');
  }

  if ('planId' in input && typeof input.planId !== 'undefined') {
    ean['#planId'] = 'planId';
    eav[':planId'] = input.planId;
    updateExpression.push('#planId = :planId');
  }

  if ('planName' in input && typeof input.planName !== 'undefined') {
    ean['#planName'] = 'planName';
    eav[':planName'] = input.planName;
    updateExpression.push('#planName = :planName');
  }

  if ('reason' in input && typeof input.reason !== 'undefined') {
    ean['#reason'] = 'reason';
    eav[':reason'] = input.reason;
    updateExpression.push('#reason = :reason');
  }

  if (
    'yearlyPriceInCents' in input &&
    typeof input.yearlyPriceInCents !== 'undefined'
  ) {
    ean['#yearlyPriceInCents'] = 'yearlyPriceInCents';
    eav[':yearlyPriceInCents'] = input.yearlyPriceInCents;
    updateExpression.push('#yearlyPriceInCents = :yearlyPriceInCents');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a Subscription object */
export function unmarshallSubscription(
  item: Record<string, any>
): Subscription {
  let result: Subscription = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    effectiveDate: unmarshallRequiredField(
      item,
      'effectiveDate',
      ['effectiveDate', 'effective_date'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    githubEventActionSort: unmarshallRequiredField(
      item,
      'githubEventActionSort',
      ['githubEventActionSort', 'github_event_action_sort']
    ),
    id: Base64.encode(`Subscription:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('billingCycle' in item || 'billing_cycle' in item) {
    result = {
      ...result,
      billingCycle: unmarshallOptionalField(item, 'billingCycle', [
        'billingCycle',
        'billing_cycle',
      ]),
    };
  }
  if ('cancelled' in item || 'cancelled' in item) {
    result = {
      ...result,
      cancelled: unmarshallOptionalField(item, 'cancelled', [
        'cancelled',
        'cancelled',
      ]),
    };
  }
  if (
    ('freeTrialEndsOn' in item && item.freeTrialEndsOn !== null) ||
    ('free_trial_ends_on' in item && item.free_trial_ends_on !== null)
  ) {
    result = {
      ...result,
      freeTrialEndsOn: unmarshallOptionalField(
        item,
        'freeTrialEndsOn',
        ['freeTrialEndsOn', 'free_trial_ends_on'],
        (v) => new Date(v)
      ),
    };
  }
  if ('githubEventAction' in item || 'github_event_action' in item) {
    result = {
      ...result,
      githubEventAction: unmarshallOptionalField(item, 'githubEventAction', [
        'githubEventAction',
        'github_event_action',
      ]),
    };
  }
  if ('githubEventId' in item || 'github_event_id' in item) {
    result = {
      ...result,
      githubEventId: unmarshallOptionalField(item, 'githubEventId', [
        'githubEventId',
        'github_event_id',
      ]),
    };
  }
  if ('marketplacePurchase' in item || 'marketplace_purchase' in item) {
    result = {
      ...result,
      marketplacePurchase: unmarshallOptionalField(
        item,
        'marketplacePurchase',
        ['marketplacePurchase', 'marketplace_purchase']
      ),
    };
  }
  if (
    'marketplacePurchaseAction' in item ||
    'marketplace_purchase_action' in item
  ) {
    result = {
      ...result,
      marketplacePurchaseAction: unmarshallOptionalField(
        item,
        'marketplacePurchaseAction',
        ['marketplacePurchaseAction', 'marketplace_purchase_action']
      ),
    };
  }
  if ('monthlyPriceInCents' in item || 'monthly_price_in_cents' in item) {
    result = {
      ...result,
      monthlyPriceInCents: unmarshallOptionalField(
        item,
        'monthlyPriceInCents',
        ['monthlyPriceInCents', 'monthly_price_in_cents']
      ),
    };
  }
  if (
    ('nextBillingDate' in item && item.nextBillingDate !== null) ||
    ('next_billing_date' in item && item.next_billing_date !== null)
  ) {
    result = {
      ...result,
      nextBillingDate: unmarshallOptionalField(
        item,
        'nextBillingDate',
        ['nextBillingDate', 'next_billing_date'],
        (v) => new Date(v)
      ),
    };
  }
  if ('onFreeTrial' in item || 'on_free_trial' in item) {
    result = {
      ...result,
      onFreeTrial: unmarshallOptionalField(item, 'onFreeTrial', [
        'onFreeTrial',
        'on_free_trial',
      ]),
    };
  }
  if ('planId' in item || 'plan_id' in item) {
    result = {
      ...result,
      planId: unmarshallOptionalField(item, 'planId', ['planId', 'plan_id']),
    };
  }
  if ('planName' in item || 'plan_name' in item) {
    result = {
      ...result,
      planName: unmarshallOptionalField(item, 'planName', [
        'planName',
        'plan_name',
      ]),
    };
  }
  if ('reason' in item || 'reason' in item) {
    result = {
      ...result,
      reason: unmarshallOptionalField(item, 'reason', ['reason', 'reason']),
    };
  }
  if ('yearlyPriceInCents' in item || 'yearly_price_in_cents' in item) {
    result = {
      ...result,
      yearlyPriceInCents: unmarshallOptionalField(item, 'yearlyPriceInCents', [
        'yearlyPriceInCents',
        'yearly_price_in_cents',
      ]),
    };
  }

  let githubEventActionSortComputed = false;
  const githubEventActionSortDatabaseValue = unmarshallRequiredField(
    item,
    'githubEventActionSort',
    ['githubEventActionSort', 'github_event_action_sort']
  );
  let githubEventActionSortComputedValue: Subscription['githubEventActionSort'];
  Object.defineProperty(result, 'githubEventActionSort', {
    enumerable: true,
    /** getter */
    get() {
      if (!githubEventActionSortComputed) {
        githubEventActionSortComputed = true;
        if (typeof githubEventActionSortDatabaseValue !== 'undefined') {
          githubEventActionSortComputedValue =
            githubEventActionSortDatabaseValue;
        } else {
          githubEventActionSortComputedValue =
            computeSubscriptionGithubEventActionSort(this);
        }
      }
      return githubEventActionSortComputedValue;
    },
  });

  return result;
}

export interface UserPrimaryKey {
  externalId: Scalars['String'];
  vendor: Vendor;
}

export type CreateUserInput = Omit<
  User,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateUserOutput = ResultType<User>;
/**  */
export async function createUser(
  input: Readonly<CreateUserInput>
): Promise<Readonly<CreateUserOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUser(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: 'USER#0',
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'User',
      () =>
        new DataIntegrityError(
          `Expected to write User but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUser(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('User', {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: 'USER#0',
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

export type BlindWriteUserInput = Omit<
  User,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<User, 'createdAt'>>;

export type BlindWriteUserOutput = ResultType<User>;
/** */
export async function blindWriteUser(
  input: Readonly<BlindWriteUserInput>
): Promise<Readonly<BlindWriteUserOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUser(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {pk: ['USER', input.vendor, input.externalId].join('#'), sk: 'USER#0'},
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
      item._et === 'User',
      () =>
        new DataIntegrityError(
          `Expected to write User but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUser(item),
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

export type DeleteUserOutput = ResultType<void>;

/**  */
export async function deleteUser(
  input: UserPrimaryKey
): Promise<DeleteUserOutput> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: 'USER#0',
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
      throw new NotFoundError('User', input);
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

export type ReadUserOutput = ResultType<User>;

/**  */
export async function readUser(
  input: UserPrimaryKey
): Promise<Readonly<ReadUserOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {pk: ['USER', input.vendor, input.externalId].join('#'), sk: 'USER#0'},
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

    assert(item, () => new NotFoundError('User', input));
    assert(
      item._et === 'User',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a User but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallUser(item),
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

export type UpdateUserInput = Omit<
  User,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateUserOutput = ResultType<User>;

/**  */
export async function updateUser(
  input: Readonly<UpdateUserInput>
): Promise<Readonly<UpdateUserOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUser(input);
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
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: 'USER#0',
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
      item._et === 'User',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            externalId: input.externalId,
            vendor: input.vendor,
          })} to update a User but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUser(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readUser(input);
      } catch {
        throw new NotFoundError('User', {
          externalId: input.externalId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('User', {
        externalId: input.externalId,
        vendor: input.vendor,
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

export type QueryUserInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryUserOutput = MultiResultType<User>;

/** helper */
function makeEanForQueryUser(input: QueryUserInput): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryUser(input: QueryUserInput): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['USER', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('USER', [], input),
    };
  }
}

/** helper */
function makeKceForQueryUser(
  input: QueryUserInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryUser */
export async function queryUser(
  input: Readonly<QueryUserInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryUserOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const ExpressionAttributeNames = makeEanForQueryUser(input);
  const ExpressionAttributeValues = makeEavForQueryUser(input);
  const KeyConditionExpression = makeKceForQueryUser(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'User',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only User was expected.`
            )
        );
        return unmarshallUser(item);
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

/** queries the User table by primary key using a node id */
export async function queryUserByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<User>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryUserInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  const {capacity, items} = await queryUser(primaryKey);

  assert(items.length > 0, () => new NotFoundError('User', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple User with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the User table by primary key using a node id */
export async function queryUserByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<User>, 'metrics'>>> {
  const {capacity, items} = await queryUser({index: 'publicId', publicId});

  assert(items.length > 0, () => new NotFoundError('User', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(`Found multiple User with publicId ${publicId}`)
  );

  return {capacity, item: items[0]};
}

export interface MarshallUserOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallUserInput = Required<Pick<User, 'externalId' | 'vendor'>> &
  Partial<
    Pick<
      User,
      'avatarUrl' | 'displayName' | 'email' | 'login' | 'raw' | 'version'
    >
  >;

/** Marshalls a DynamoDB record into a User object */
export function marshallUser(
  input: MarshallUserInput,
  now = new Date()
): MarshallUserOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'externalId',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'User',
    ':externalId': input.externalId,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  if ('avatarUrl' in input && typeof input.avatarUrl !== 'undefined') {
    ean['#avatarUrl'] = 'avatarUrl';
    eav[':avatarUrl'] = input.avatarUrl;
    updateExpression.push('#avatarUrl = :avatarUrl');
  }

  if ('displayName' in input && typeof input.displayName !== 'undefined') {
    ean['#displayName'] = 'displayName';
    eav[':displayName'] = input.displayName;
    updateExpression.push('#displayName = :displayName');
  }

  if ('email' in input && typeof input.email !== 'undefined') {
    ean['#email'] = 'email';
    eav[':email'] = input.email;
    updateExpression.push('#email = :email');
  }

  if ('login' in input && typeof input.login !== 'undefined') {
    ean['#login'] = 'login';
    eav[':login'] = input.login;
    updateExpression.push('#login = :login');
  }

  if ('raw' in input && typeof input.raw !== 'undefined') {
    ean['#raw'] = 'raw';
    eav[':raw'] = input.raw;
    updateExpression.push('#raw = :raw');
  }
  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a User object */
export function unmarshallUser(item: Record<string, any>): User {
  let result: User = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    id: Base64.encode(`User:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  if ('avatarUrl' in item || 'avatar_url' in item) {
    result = {
      ...result,
      avatarUrl: unmarshallOptionalField(item, 'avatarUrl', [
        'avatarUrl',
        'avatar_url',
      ]),
    };
  }
  if ('displayName' in item || 'display_name' in item) {
    result = {
      ...result,
      displayName: unmarshallOptionalField(item, 'displayName', [
        'displayName',
        'display_name',
      ]),
    };
  }
  if ('email' in item || 'email' in item) {
    result = {
      ...result,
      email: unmarshallOptionalField(item, 'email', ['email', 'email']),
    };
  }
  if ('login' in item || 'login' in item) {
    result = {
      ...result,
      login: unmarshallOptionalField(item, 'login', ['login', 'login']),
    };
  }
  if ('raw' in item || 'raw' in item) {
    result = {
      ...result,
      raw: unmarshallOptionalField(item, 'raw', ['raw', 'raw']),
    };
  }

  return result;
}

export interface UserEmailPrimaryKey {
  email: Scalars['String'];
  externalId: Scalars['String'];
  vendor: Vendor;
}

export type CreateUserEmailInput = Omit<
  UserEmail,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateUserEmailOutput = ResultType<UserEmail>;
/**  */
export async function createUserEmail(
  input: Readonly<CreateUserEmailInput>
): Promise<Readonly<CreateUserEmailOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserEmail(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_EMAIL', input.email].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'UserEmail',
      () =>
        new DataIntegrityError(
          `Expected to write UserEmail but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserEmail(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('UserEmail', {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_EMAIL', input.email].join('#'),
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

export type BlindWriteUserEmailInput = Omit<
  UserEmail,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<UserEmail, 'createdAt'>>;

export type BlindWriteUserEmailOutput = ResultType<UserEmail>;
/** */
export async function blindWriteUserEmail(
  input: Readonly<BlindWriteUserEmailInput>
): Promise<Readonly<BlindWriteUserEmailOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserEmail(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['USER', input.vendor, input.externalId].join('#'),
      sk: ['USER_EMAIL', input.email].join('#'),
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
      item._et === 'UserEmail',
      () =>
        new DataIntegrityError(
          `Expected to write UserEmail but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserEmail(item),
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

export type DeleteUserEmailOutput = ResultType<void>;

/**  */
export async function deleteUserEmail(
  input: UserEmailPrimaryKey
): Promise<DeleteUserEmailOutput> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_EMAIL', input.email].join('#'),
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
      throw new NotFoundError('UserEmail', input);
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

export type ReadUserEmailOutput = ResultType<UserEmail>;

/**  */
export async function readUserEmail(
  input: UserEmailPrimaryKey
): Promise<Readonly<ReadUserEmailOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['USER', input.vendor, input.externalId].join('#'),
      sk: ['USER_EMAIL', input.email].join('#'),
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

    assert(item, () => new NotFoundError('UserEmail', input));
    assert(
      item._et === 'UserEmail',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a UserEmail but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserEmail(item),
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

export type UpdateUserEmailInput = Omit<
  UserEmail,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateUserEmailOutput = ResultType<UserEmail>;

/**  */
export async function updateUserEmail(
  input: Readonly<UpdateUserEmailInput>
): Promise<Readonly<UpdateUserEmailOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserEmail(input);
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
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_EMAIL', input.email].join('#'),
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
      item._et === 'UserEmail',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            email: input.email,
            externalId: input.externalId,
            vendor: input.vendor,
          })} to update a UserEmail but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserEmail(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readUserEmail(input);
      } catch {
        throw new NotFoundError('UserEmail', {
          email: input.email,
          externalId: input.externalId,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('UserEmail', {
        email: input.email,
        externalId: input.externalId,
        vendor: input.vendor,
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

export type QueryUserEmailInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {email: Scalars['String']; externalId: Scalars['String']; vendor: Vendor}
  | {index: 'gsi1'; email: Scalars['String']; vendor: Vendor}
  | {
      index: 'gsi1';
      email: Scalars['String'];
      updatedAt: Scalars['Date'];
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryUserEmailOutput = MultiResultType<UserEmail>;

/** helper */
function makeEanForQueryUserEmail(
  input: QueryUserEmailInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryUserEmail(
  input: QueryUserEmailInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['USER_EMAIL', input.vendor, input.email].join('#'),
        ':sk': makeSortKeyForQuery('USER', ['updatedAt'], input),
      };
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['USER', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('USER_EMAIL', ['email'], input),
    };
  }
}

/** helper */
function makeKceForQueryUserEmail(
  input: QueryUserEmailInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryUserEmail */
export async function queryUserEmail(
  input: Readonly<QueryUserEmailInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryUserEmailOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const ExpressionAttributeNames = makeEanForQueryUserEmail(input);
  const ExpressionAttributeValues = makeEavForQueryUserEmail(input);
  const KeyConditionExpression = makeKceForQueryUserEmail(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'UserEmail',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only UserEmail was expected.`
            )
        );
        return unmarshallUserEmail(item);
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

/** queries the UserEmail table by primary key using a node id */
export async function queryUserEmailByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<UserEmail>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryUserEmailInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.email = primaryKeyValues[5];
  }

  const {capacity, items} = await queryUserEmail(primaryKey);

  assert(items.length > 0, () => new NotFoundError('UserEmail', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple UserEmail with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the UserEmail table by primary key using a node id */
export async function queryUserEmailByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<UserEmail>, 'metrics'>>> {
  const {capacity, items} = await queryUserEmail({index: 'publicId', publicId});

  assert(items.length > 0, () => new NotFoundError('UserEmail', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple UserEmail with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallUserEmailOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallUserEmailInput = Required<
  Pick<UserEmail, 'email' | 'externalId' | 'vendor'>
> &
  Partial<Pick<UserEmail, 'version'>>;

/** Marshalls a DynamoDB record into a UserEmail object */
export function marshallUserEmail(
  input: MarshallUserEmailInput,
  now = new Date()
): MarshallUserEmailOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#email = :email',
    '#externalId = :externalId',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#email': 'email',
    '#externalId': 'externalId',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'UserEmail',
    ':email': input.email,
    ':externalId': input.externalId,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': ['USER_EMAIL', input.vendor, input.email].join('#'),
    ':gsi1sk': ['USER', now.getTime()].join('#'),
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a UserEmail object */
export function unmarshallUserEmail(item: Record<string, any>): UserEmail {
  const result: UserEmail = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    email: unmarshallRequiredField(item, 'email', ['email', 'email']),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    id: Base64.encode(`UserEmail:${item.pk}#:#${item.sk}`),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface UserLoginPrimaryKey {
  externalId: Scalars['String'];
  login: Scalars['String'];
  vendor: Vendor;
}

export type CreateUserLoginInput = Omit<
  UserLogin,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
>;
export type CreateUserLoginOutput = ResultType<UserLogin>;
/**  */
export async function createUserLogin(
  input: Readonly<CreateUserLoginInput>
): Promise<Readonly<CreateUserLoginOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserLogin(input, now);

  const publicId = idGenerator();
  try {
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        '#publicId': 'publicId',
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ':publicId': publicId,
      },
      Key: {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_LOGIN', input.login].join('#'),
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        '#publicId = :publicId',
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
      item._et === 'UserLogin',
      () =>
        new DataIntegrityError(
          `Expected to write UserLogin but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserLogin(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('UserLogin', {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_LOGIN', input.login].join('#'),
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

export type BlindWriteUserLoginInput = Omit<
  UserLogin,
  'createdAt' | 'id' | 'publicId' | 'updatedAt' | 'version'
> &
  Partial<Pick<UserLogin, 'createdAt'>>;

export type BlindWriteUserLoginOutput = ResultType<UserLogin>;
/** */
export async function blindWriteUserLogin(
  input: Readonly<BlindWriteUserLoginInput>
): Promise<Readonly<BlindWriteUserLoginOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserLogin(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean = {
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    '#publicId': 'publicId',
  };
  const eav = {
    ...ExpressionAttributeValues,
    ':one': 1,
    ':createdAt': now.getTime(),
    ':publicId': idGenerator(),
  };
  const ue = `${[
    ...UpdateExpression.split(', ').filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    '#publicId = if_not_exists(#publicId, :publicId)',
  ].join(', ')} ADD #version :one`;

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: {
      pk: ['USER', input.vendor, input.externalId].join('#'),
      sk: ['USER_LOGIN', input.login].join('#'),
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
      item._et === 'UserLogin',
      () =>
        new DataIntegrityError(
          `Expected to write UserLogin but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserLogin(item),
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

export type DeleteUserLoginOutput = ResultType<void>;

/**  */
export async function deleteUserLogin(
  input: UserLoginPrimaryKey
): Promise<DeleteUserLoginOutput> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_LOGIN', input.login].join('#'),
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
      throw new NotFoundError('UserLogin', input);
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

export type ReadUserLoginOutput = ResultType<UserLogin>;

/**  */
export async function readUserLogin(
  input: UserLoginPrimaryKey
): Promise<Readonly<ReadUserLoginOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: false,
    Key: {
      pk: ['USER', input.vendor, input.externalId].join('#'),
      sk: ['USER_LOGIN', input.login].join('#'),
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

    assert(item, () => new NotFoundError('UserLogin', input));
    assert(
      item._et === 'UserLogin',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a UserLogin but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserLogin(item),
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

export type UpdateUserLoginInput = Omit<
  UserLogin,
  'createdAt' | 'id' | 'publicId' | 'updatedAt'
>;
export type UpdateUserLoginOutput = ResultType<UserLogin>;

/**  */
export async function updateUserLogin(
  input: Readonly<UpdateUserLoginInput>
): Promise<Readonly<UpdateUserLoginOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserLogin(input);
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
        pk: ['USER', input.vendor, input.externalId].join('#'),
        sk: ['USER_LOGIN', input.login].join('#'),
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
      item._et === 'UserLogin',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            externalId: input.externalId,
            login: input.login,
            vendor: input.vendor,
          })} to update a UserLogin but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserLogin(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readUserLogin(input);
      } catch {
        throw new NotFoundError('UserLogin', {
          externalId: input.externalId,
          login: input.login,
          vendor: input.vendor,
        });
      }
      throw new OptimisticLockingError('UserLogin', {
        externalId: input.externalId,
        login: input.login,
        vendor: input.vendor,
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

export type QueryUserLoginInput =
  | {externalId: Scalars['String']; vendor: Vendor}
  | {externalId: Scalars['String']; login: Scalars['String']; vendor: Vendor}
  | {index: 'gsi1'; login: Scalars['String']; vendor: Vendor}
  | {
      index: 'gsi1';
      login: Scalars['String'];
      updatedAt: Scalars['Date'];
      vendor: Vendor;
    }
  | {index: 'publicId'; publicId: Scalars['String']};
export type QueryUserLoginOutput = MultiResultType<UserLogin>;

/** helper */
function makeEanForQueryUserLogin(
  input: QueryUserLoginInput
): Record<string, string> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {'#pk': 'gsi1pk', '#sk': 'gsi1sk'};
    } else if (input.index === 'publicId') {
      return {'#pk': 'publicId'};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {'#pk': 'pk', '#sk': 'sk'};
  }
}

/** helper */
function makeEavForQueryUserLogin(
  input: QueryUserLoginInput
): Record<string, any> {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return {
        ':pk': ['USER_LOGIN', input.vendor, input.login].join('#'),
        ':sk': makeSortKeyForQuery('USER', ['updatedAt'], input),
      };
    } else if (input.index === 'publicId') {
      return {':pk': [input.publicId].join('#')};
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return {
      ':pk': ['USER', input.vendor, input.externalId].join('#'),
      ':sk': makeSortKeyForQuery('USER_LOGIN', ['login'], input),
    };
  }
}

/** helper */
function makeKceForQueryUserLogin(
  input: QueryUserLoginInput,
  {operator}: Pick<QueryOptions, 'operator'>
): string {
  if ('index' in input) {
    if (input.index === 'gsi1') {
      return `#pk = :pk AND ${
        operator === 'begins_with'
          ? 'begins_with(#sk, :sk)'
          : `#sk ${operator} :sk`
      }`;
    } else if (input.index === 'publicId') {
      return '#pk = :pk';
    }
    throw new Error(
      'Invalid index. If TypeScript did not catch this, then this is a bug in codegen.'
    );
  } else {
    return `#pk = :pk AND ${
      operator === 'begins_with'
        ? 'begins_with(#sk, :sk)'
        : `#sk ${operator} :sk`
    }`;
  }
}

/** queryUserLogin */
export async function queryUserLogin(
  input: Readonly<QueryUserLoginInput>,
  {
    limit = undefined,
    nextToken,
    operator = 'begins_with',
    reverse = false,
  }: QueryOptions = {}
): Promise<Readonly<QueryUserLoginOutput>> {
  const tableName = process.env.TABLE_APPLICATION_DATA;
  assert(tableName, 'TABLE_APPLICATION_DATA is not set');

  const ExpressionAttributeNames = makeEanForQueryUserLogin(input);
  const ExpressionAttributeValues = makeEavForQueryUserLogin(input);
  const KeyConditionExpression = makeKceForQueryUserLogin(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: false,
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
          item._et === 'UserLogin',
          () =>
            new DataIntegrityError(
              `Query result included at item with type ${item._et}. Only UserLogin was expected.`
            )
        );
        return unmarshallUserLogin(item);
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

/** queries the UserLogin table by primary key using a node id */
export async function queryUserLoginByNodeId(
  id: Scalars['ID']
): Promise<Readonly<Omit<ResultType<UserLogin>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id)
    .split(':')
    .slice(1)
    .join(':')
    .split('#');

  const primaryKey: QueryUserLoginInput = {
    vendor: primaryKeyValues[1] as Vendor,
    externalId: primaryKeyValues[2],
  };

  if (typeof primaryKeyValues[2] !== 'undefined') {
    // @ts-ignore - TSC will usually see this as an error because it determined
    // that primaryKey is the no-sort-fields-specified version of the type.
    primaryKey.login = primaryKeyValues[5];
  }

  const {capacity, items} = await queryUserLogin(primaryKey);

  assert(items.length > 0, () => new NotFoundError('UserLogin', primaryKey));
  assert(
    items.length < 2,
    () => new DataIntegrityError(`Found multiple UserLogin with id ${id}`)
  );

  return {capacity, item: items[0]};
}

/** queries the UserLogin table by primary key using a node id */
export async function queryUserLoginByPublicId(
  publicId: Scalars['String']
): Promise<Readonly<Omit<ResultType<UserLogin>, 'metrics'>>> {
  const {capacity, items} = await queryUserLogin({index: 'publicId', publicId});

  assert(items.length > 0, () => new NotFoundError('UserLogin', {publicId}));
  assert(
    items.length < 2,
    () =>
      new DataIntegrityError(
        `Found multiple UserLogin with publicId ${publicId}`
      )
  );

  return {capacity, item: items[0]};
}

export interface MarshallUserLoginOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallUserLoginInput = Required<
  Pick<UserLogin, 'externalId' | 'login' | 'vendor'>
> &
  Partial<Pick<UserLogin, 'version'>>;

/** Marshalls a DynamoDB record into a UserLogin object */
export function marshallUserLogin(
  input: MarshallUserLoginInput,
  now = new Date()
): MarshallUserLoginOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#externalId = :externalId',
    '#login = :login',
    '#updatedAt = :updatedAt',
    '#vendor = :vendor',
    '#version = :version',
    '#gsi1pk = :gsi1pk',
    '#gsi1sk = :gsi1sk',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#externalId': 'externalId',
    '#login': 'login',
    '#updatedAt': '_md',
    '#vendor': 'vendor',
    '#version': '_v',
    '#gsi1pk': 'gsi1pk',
    '#gsi1sk': 'gsi1sk',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'UserLogin',
    ':externalId': input.externalId,
    ':login': input.login,
    ':vendor': input.vendor,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
    ':gsi1pk': ['USER_LOGIN', input.vendor, input.login].join('#'),
    ':gsi1sk': ['USER', now.getTime()].join('#'),
  };

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a UserLogin object */
export function unmarshallUserLogin(item: Record<string, any>): UserLogin {
  const result: UserLogin = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    externalId: unmarshallRequiredField(item, 'externalId', [
      'externalId',
      'external_id',
    ]),
    id: Base64.encode(`UserLogin:${item.pk}#:#${item.sk}`),
    login: unmarshallRequiredField(item, 'login', ['login', 'login']),
    publicId: unmarshallRequiredField(item, 'publicId', ['publicId']),
    updatedAt: unmarshallRequiredField(
      item,
      'updatedAt',
      ['_md'],
      (v) => new Date(v)
    ),
    vendor: unmarshallRequiredField(item, 'vendor', ['vendor', 'vendor']),
    version: unmarshallRequiredField(item, 'version', ['_v']),
  };

  return result;
}

export interface UserSessionPrimaryKey {
  sessionId: Scalars['String'];
}

export type CreateUserSessionInput = Omit<
  UserSession,
  'createdAt' | 'expires' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<UserSession, 'expires'>>;
export type CreateUserSessionOutput = ResultType<UserSession>;
/**  */
export async function createUserSession(
  input: Readonly<CreateUserSessionInput>
): Promise<Readonly<CreateUserSessionOutput>> {
  const tableName = process.env.TABLE_USER_SESSION;
  assert(tableName, 'TABLE_USER_SESSION is not set');

  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserSession(input, now);

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
      Key: {pk: ['USER_SESSION', input.sessionId].join('#')},
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
      item._et === 'UserSession',
      () =>
        new DataIntegrityError(
          `Expected to write UserSession but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserSession(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('UserSession', {
        pk: ['USER_SESSION', input.sessionId].join('#'),
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

export type BlindWriteUserSessionInput = Omit<
  UserSession,
  'createdAt' | 'expires' | 'id' | 'updatedAt' | 'version'
> &
  Partial<Pick<UserSession, 'expires'>> &
  Partial<Pick<UserSession, 'createdAt'>>;

export type BlindWriteUserSessionOutput = ResultType<UserSession>;
/** */
export async function blindWriteUserSession(
  input: Readonly<BlindWriteUserSessionInput>
): Promise<Readonly<BlindWriteUserSessionOutput>> {
  const tableName = process.env.TABLE_USER_SESSION;
  assert(tableName, 'TABLE_USER_SESSION is not set');
  const now = new Date();

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserSession(input, now);

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
    Key: {pk: ['USER_SESSION', input.sessionId].join('#')},
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
      item._et === 'UserSession',
      () =>
        new DataIntegrityError(
          `Expected to write UserSession but wrote ${item?._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserSession(item),
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

export type DeleteUserSessionOutput = ResultType<void>;

/**  */
export async function deleteUserSession(
  input: UserSessionPrimaryKey
): Promise<DeleteUserSessionOutput> {
  const tableName = process.env.TABLE_USER_SESSION;
  assert(tableName, 'TABLE_USER_SESSION is not set');

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {pk: ['USER_SESSION', input.sessionId].join('#')},
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
      throw new NotFoundError('UserSession', input);
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

export type ReadUserSessionOutput = ResultType<UserSession>;

/**  */
export async function readUserSession(
  input: UserSessionPrimaryKey
): Promise<Readonly<ReadUserSessionOutput>> {
  const tableName = process.env.TABLE_USER_SESSION;
  assert(tableName, 'TABLE_USER_SESSION is not set');

  const commandInput: GetCommandInput = {
    ConsistentRead: true,
    Key: {pk: ['USER_SESSION', input.sessionId].join('#')},
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

    assert(item, () => new NotFoundError('UserSession', input));
    assert(
      item._et === 'UserSession',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify(input)} to load a UserSession but loaded ${
            item._et
          } instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserSession(item),
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

export type UpdateUserSessionInput = Omit<
  UserSession,
  'createdAt' | 'expires' | 'id' | 'updatedAt'
> &
  Partial<Pick<UserSession, 'expires'>>;
export type UpdateUserSessionOutput = ResultType<UserSession>;

/**  */
export async function updateUserSession(
  input: Readonly<UpdateUserSessionInput>
): Promise<Readonly<UpdateUserSessionOutput>> {
  const tableName = process.env.TABLE_USER_SESSION;
  assert(tableName, 'TABLE_USER_SESSION is not set');

  const {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
  } = marshallUserSession(input);
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
      Key: {pk: ['USER_SESSION', input.sessionId].join('#')},
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
      item._et === 'UserSession',
      () =>
        new DataIntegrityError(
          `Expected ${JSON.stringify({
            sessionId: input.sessionId,
          })} to update a UserSession but updated ${item._et} instead`
        )
    );

    return {
      capacity,
      item: unmarshallUserSession(item),
      metrics,
    };
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await readUserSession(input);
      } catch {
        throw new NotFoundError('UserSession', {sessionId: input.sessionId});
      }
      throw new OptimisticLockingError('UserSession', {
        sessionId: input.sessionId,
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

export interface MarshallUserSessionOutput {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type MarshallUserSessionInput = Required<
  Pick<UserSession, 'session' | 'sessionId'>
> &
  Partial<Pick<UserSession, 'expires' | 'version'>>;

/** Marshalls a DynamoDB record into a UserSession object */
export function marshallUserSession(
  input: MarshallUserSessionInput,
  now = new Date()
): MarshallUserSessionOutput {
  const updateExpression: string[] = [
    '#entity = :entity',
    '#session = :session',
    '#sessionId = :sessionId',
    '#updatedAt = :updatedAt',
    '#version = :version',
  ];

  const ean: Record<string, string> = {
    '#entity': '_et',
    '#pk': 'pk',
    '#session': 'session',
    '#sessionId': 'sessionId',
    '#updatedAt': '_md',
    '#version': '_v',
  };

  const eav: Record<string, unknown> = {
    ':entity': 'UserSession',
    ':session': input.session,
    ':sessionId': input.sessionId,
    ':updatedAt': now.getTime(),
    ':version': ('version' in input ? input.version ?? 0 : 0) + 1,
  };

  if ('expires' in input && typeof input.expires !== 'undefined') {
    assert(
      !Number.isNaN(input.expires.getTime()),
      'expires was passed but is not a valid date'
    );
    ean['#expires'] = 'ttl';
    eav[':expires'] =
      input.expires === null
        ? null
        : Math.floor(input.expires.getTime() / 1000);
    updateExpression.push('#expires = :expires');
  } else {
    ean['#expires'] = 'ttl';
    eav[':expires'] = now.getTime() + 86400000;
    updateExpression.push('#expires = :expires');
  }

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
  };
}

/** Unmarshalls a DynamoDB record into a UserSession object */
export function unmarshallUserSession(item: Record<string, any>): UserSession {
  const result: UserSession = {
    createdAt: unmarshallRequiredField(
      item,
      'createdAt',
      ['_ct'],
      (v) => new Date(v)
    ),
    expires: unmarshallRequiredField(
      item,
      'expires',
      ['ttl'],
      (v) => new Date(v * 1000)
    ),
    id: Base64.encode(`UserSession:${item.pk}`),
    session: unmarshallRequiredField(item, 'session', ['session', 'session']),
    sessionId: unmarshallRequiredField(item, 'sessionId', [
      'sessionId',
      'session_id',
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
