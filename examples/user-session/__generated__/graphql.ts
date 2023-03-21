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

/** Automatically adds a createdAt and updatedAt timestamp to the entity and sets them appropriately. The createdAt timestamp is only set on create, while the updatedAt timestamp is set on create and update. */
export interface Timestamped {
  /** Set automatically when the item is first written */
  createdAt: Scalars['Date'];
  /** Set automatically when the item is updated */
  updatedAt: Scalars['Date'];
}

/** A user session object. */
export interface UserSession extends Model, Timestamped, Versioned {
  __typename?: 'UserSession';
  createdAt: Scalars['Date'];
  expires: Scalars['Date'];
  id: Scalars['ID'];
  session: Scalars['JSONObject'];
  /**
   * Since \`id\` is a reserved field, sessionId is the field we'll use to inject a
   * random uuid, which the underlying system will use as the basis for \`id\`.
   */
  sessionId: Scalars['String'];
  updatedAt: Scalars['Date'];
  version: Scalars['Int'];
}

/** Automatically adds a column to enable optimistic locking. This field shouldn't be manipulated directly, but may need to be passed around by the runtime in order to make updates. */
export interface Versioned {
  version: Scalars['Int'];
}
