export const schema = `"""
JavaScript Date stored as a Number in DynamoDB
"""
scalar Date

"""
Arbitrary JSON stored as a Map in DynamoDB
"""
scalar JSONObject

"""
Allows specifying an alternate column name.
"""
directive @alias(name: String!) on FIELD_DEFINITION

"""
Indicates all reads for this type will be done using DynamoDB's
strong-consistency mode. General discouraged, though certain user-facing flows
might require it.
"""
directive @consistent on OBJECT

"""
Indicates the Model in question must use a partition key without a sort key as
its primary key.
"""
directive @partitionKey(pkFields: [String!]!, pkPrefix: String) on OBJECT

"""
Reusable options for all generated lambdas
"""
input LambdaConfig {
  """
  Measured in megabytes.
  """
  memory: Int
  """
  Measured in seconds. Reminder that handlers may need to do retries in-band, so
  consider making this a relatively high number and using alarms to catch
  timeouts rather than terminating the function. In order to make space for up
  to 5 retries, please add sixty seconds to your intended timeout.
  """
  timeout: Int
}

"""
Configuration specific to a table dispatcher
"""
input DispatcherConfig {
  lambdaConfig: LambdaConfig
}

"""
Configuration specific to a model handler
"""
input HandlerConfig {
  lambdaConfig: LambdaConfig
}

"""
CDC Event Types
"""
enum CdcEvent {
  INSERT
  MODIFY
  REMOVE
  UPSERT
}

"""
Enriches the targetModel anytime there's a change to this model.
"""
directive @enriches(
  """
  Optional config to define the lambda parameters for the dispatcher and related
  resources
  """
  dispatcherConfig: DispatcherConfig
  """
  The type of change events to subscribe to.
  """
  event: CdcEvent!
  """
  Optional config to define the lambda parameters for the handler and related
  resources
  """
  handlerConfig: HandlerConfig
  """
  Name to import from the module at importPath.
  """
  importName: String!
  """
  Path to the requireable package that handles a specific event.
  """
  importPath: String!
  """
  The model type that will be updated by this stream.
  """
  targetModel: String!
) repeatable on OBJECT

"""
Triggers the specified handler whenever there's a change to this model.
"""
directive @reduces(
  """
  Optional config to define the lambda parameters for the dispatcher and related
  resources
  """
  dispatcherConfig: DispatcherConfig
  """
  The type of change events to subscribe to.
  """
  event: CdcEvent!
  """
  Optional config to define the lambda parameters for the handler and related
  resources
  """
  handlerConfig: HandlerConfig
  """
  Name to import from the module at importPath.
  """
  importName: String!
  """
  Path to the requireable package that handles a specific event.
  """
  importPath: String!
  """
  Indicates this reducer produces multiple output records
  """
  multiReduce: Boolean
  """
  Indicates if this handler's resources should be defined in the main
  CloudFormation template or in a nested stack
  """
  nestStack: Boolean
  """
  List of model names that this handler should be allowed to query. The
  CloudFormation resource will be updated accordingly.
  @experimental
  """
  readableModels: [String!]
  """
  The model type that will be updated by this stream.
  """
  targetModel: String!
  """
  List of model names that this handler should be allowed to write. The
  CloudFormation resource will be updated accordingly.
  @experimental
  """
  writableModels: [String!]
) repeatable on OBJECT

"""
Triggers the specified handler whenever there's a change to this model.
"""
directive @reacts(
  """
  Optional config to define the lambda parameters for the dispatcher and related
  resources
  """
  dispatcherConfig: DispatcherConfig
  """
  The type of change events to subscribe to.
  """
  event: CdcEvent!
  """
  Optional config to define the lambda parameters for the handler and related
  resources
  """
  handlerConfig: HandlerConfig
  """
  Name to import from the module at importPath.
  """
  importName: String!
  """
  Path to the requireable package that handles a specific event.
  """
  importPath: String!
  """
  Indicates if this handler's resources should be defined in the main
  CloudFormation template or in a nested stack
  """
  nestStack: Boolean
  """
  List of model names that this handler should be allowed to query. The
  CloudFormation resource will be updated accordingly.
  @experimental
  """
  readableModels: [String!]
  """
  List of model names that this handler should be allowed to write. The
  CloudFormation resource will be updated accordingly.
  @experimental
  """
  writableModels: [String!]
) repeatable on OBJECT

"""
Indicates this Model has a composite key generated from the specified fields.
"""
directive @compositeKey(
  pkFields: [String!]!
  pkPrefix: String
  skFields: [String!]!
  skPrefix: String
) on OBJECT

"""
INCLUDE is omitted at this time because it drastically complicates the schema
DSL. If a use for it arises, it'll be revisited.
"""
enum ProjectionType {
  ALL
  KEYS_ONLY
}

"""
Defines a Global Secondary Index
"""
directive @gsi(
  name: String!
  pkFields: [String!]!
  pkPrefix: String
  projectionType: ProjectionType
  skFields: [String!]
  skPrefix: String
) repeatable on OBJECT

"""
Indicates that this type is an append-only ledger and should not have touch,
update, or blindWrite.
"""
directive @ledger on OBJECT

"""
Defines a Local Secondary Index
"""
directive @lsi(
  name: String!
  projectionType: ProjectionType
  skFields: [String!]
  skPrefix: String
) repeatable on OBJECT

"""
Marks a single field as a Global Secondary Index.
"""
directive @simpleIndex(projectionType: ProjectionType) on FIELD_DEFINITION

"""
Possible case types for converting a fieldName to a DynamoDB column_name.
"""
enum ColumnCase {
  CAMEL_CASE
  SNAKE_CASE
}

"""
Allows customizing the generated attributes for a table.
"""
directive @table(
  """
  Defaults to ColumnCase.SNAKE_CASE
  """
  columnCase: ColumnCase
  """
  Defaults to true
  """
  enablePointInTimeRecovery: Boolean
  """
  Defaults to false. If true, enables stream events for the table. Note that
  you don't need to set this if you're using @enriches or @reacts. This is
  mostly here for incrementally adopting the library; you can define you schema
  with graphql and continue emitting stream events and follow up later with
  targeted cdc directives.
  """
  enableStreaming: Boolean
  """
  Allows overriding the generated table name for a Model. Generally, this is not
  recommended, but you might want to use this if you're migrating an existing
  set of tables to use this library.
  Defaults to the PascalCased name of the Model prefixed with Table
  """
  name: String
) on OBJECT

"""
Computes the value of a field using the specified function.
"""
directive @computed(
  importName: String!
  importPath: String!
  """
  Virtual computed fields exist for the sole purposes of computing a complex
  value for use with an index field. The are not persisted to the database on
  their own.

  Ideally, they would be entirely hidden from the generated types, those types
  are generated by a third-party plugin. Long run, the solution is probably to
  write a schema loader that can transform the schema before it's passed to the
  TypeScript plugin.
  """
  virtual: Boolean
) on FIELD_DEFINITION

"""
Marks a field as the source for this model's ttl value. May only be declared once per model
"""
directive @ttl(
  """
  An ISO 8601 duration string. If no value is specified for the field, the expiration date will be now + this duration
  """
  duration: String
  """
  If duration is specified, codegen will not allow user to specify a value for expiration unless this is set to true.
  """
  overridable: Boolean
) on FIELD_DEFINITION

"""
Allows configuring the ProjectionType for the publicId index of PublicModels
"""
directive @public(projection: ProjectionType!) on OBJECT

"""
Models are DynamoDB tables with a key schema that may or may not include a sort
key. A Model must be decorated with either @partitionKey or @compositeKey.

Note that, while Model does not explicitly implement Node, its \`id\` field
behaves like \`Node#id\` typically does. This is to avoid defining Node in the
injected schema if the consumer's schema also defined Node or defines it
differently.
"""
interface Model implements Timestamped & Versioned {
  createdAt: Date!
  id: ID!
  updatedAt: Date!
  version: Int!
}

"""
Like Model, but includes a \`publicId\` field which, unlike \`id\`, is semantically
meaningless. Types implementing PublicModel will have an additional function,
\`queryByPublicId\`, generated. If any of your models implement PublicModel, then
the dependencies module must include an \`idGenerator()\`.
"""
interface PublicModel implements Model & Timestamped & Versioned {
  createdAt: Date!
  id: ID!
  publicId: String!
  updatedAt: Date!
  version: Int!
}

"""
Automatically adds a createdAt and updatedAt timestamp to the entity and sets
them appropriately. The createdAt timestamp is only set on create, while the
updatedAt timestamp is set on create and update.
"""
interface Timestamped {
  """
  Set automatically when the item is first written
  """
  createdAt: Date!
  """
  Set automatically when the item is updated
  """
  updatedAt: Date!
}

"""
Automatically adds a column to enable optimistic locking. This field shouldn't
be manipulated directly, but may need to be passed around by the runtime in
order to make updates.
"""
interface Versioned {
  version: Int!
}
`;
