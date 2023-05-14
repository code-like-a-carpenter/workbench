import assert from 'assert';
import crypto from 'crypto';
import path from 'path';

import type {
  ConstDirectiveNode,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import {assertObjectType} from 'graphql';
import {camelCase, kebabCase, snakeCase, upperFirst} from 'lodash';

import type {
  BaseChangeDataCaptureConfig,
  ChangeDataCaptureConfig,
  ChangeDataCaptureEnricherConfig,
  ChangeDataCaptureReactorConfig,
  ChangeDataCaptureReducerConfig,
  DispatcherConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {DispatcherConfigSchema, HandlerConfigSchema} from '../config';
import {
  filterNull,
  getArgEnumValue,
  getArgStringValue,
  getOptionalArg,
  getOptionalArgObjectValue,
} from '../helpers';
import {
  resolveActionsModuleId,
  resolveDependenciesModuleId,
  resolveHandlerModuleId,
} from '../paths';
import {extractTableName} from '../tables';

export function extractDispatcherConfig(
  config: Config,
  outputFile: string,
  type: GraphQLObjectType
): DispatcherConfig {
  const tableName = extractTableName(type);
  const filename = `dispatcher-${kebabCase(tableName)}`;
  const functionName = `${tableName}CDCDispatcher`;
  const directory = path.join(path.dirname(outputFile), filename);

  assert(
    type?.astNode?.directives,
    `Expected to find at least one directive on type ${type.name}`
  );

  const {batchSize, maximumRetryAttempts, memorySize, timeout} =
    type.astNode.directives
      .filter((d) => d.name.value === 'reacts' || d.name.value === 'enriches')
      .map((directive) =>
        DispatcherConfigSchema.parse({
          ...config.dispatcherDefaults,
          ...getOptionalArgObjectValue('dispatcherConfig', directive),
        })
      )
      .reduce((acc, next) => {
        return {
          batchSize: Math.max(acc.batchSize, next.batchSize),
          maximumRetryAttempts: Math.max(
            acc.maximumRetryAttempts,
            next.maximumRetryAttempts
          ),
          memorySize: Math.max(acc.memorySize, next.memorySize),
          timeout: Math.max(acc.timeout, next.timeout),
        };
      }, config.dispatcherDefaults);

  const nestedStackLocation = './dispatcher.yml';

  return {
    batchSize,
    dependenciesModuleId: resolveDependenciesModuleId(config, directory),
    directory,
    filename,
    functionName,
    maximumRetryAttempts,
    memorySize,
    nestedStackLocation,
    runtimeModuleId: '@code-like-a-carpenter/foundation-runtime',
    timeout,
  };
}

/** Extracts CDC config for a type */
export function extractChangeDataCaptureConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>,
  outputFile: string
): ChangeDataCaptureConfig[] {
  return (
    type.astNode?.directives
      ?.map((directive) => {
        if (directive.name.value === 'enriches') {
          return extractEnricherConfig(
            config,
            schema,
            type,
            directive,
            outputFile
          );
        }
        if (directive.name.value === 'reacts') {
          return extractReactorConfig(
            config,
            schema,
            type,
            directive,
            outputFile
          );
        }
        if (directive.name.value === 'reduces') {
          return extractReducerConfig(
            config,
            schema,
            type,
            directive,
            outputFile
          );
        }

        return null;
      })
      .filter(filterNull) ?? []
  );
}

function getTargetTable(
  schema: GraphQLSchema,
  modelName: string,
  produces: string
) {
  const targetModel = schema.getType(produces);
  assert(
    targetModel,
    `\`targetModel\` arg on CDC directive for ${modelName} identifies ${produces}, which does not appear to identify a type`
  );
  return extractTableName(assertObjectType(targetModel));
}

export function getTargetTables(
  fieldName: string,
  schema: GraphQLSchema,
  directive: ConstDirectiveNode
): string[] {
  const arg = getOptionalArg(fieldName, directive);
  if (!arg) {
    return [];
  }

  assert(arg.value.kind === 'ListValue', `Expected ${fieldName} to be a list`);
  return Array.from(
    new Set(
      arg.value.values.map((v) => {
        assert(
          v.kind === 'StringValue',
          `Expected @${directive.name.value} directive argument "${fieldName}" to be a list of strings`
        );
        return getTargetTable(schema, directive.name.value, v.value);
      })
    )
  );
}

function extractCommonConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType,
  directive: ConstDirectiveNode,
  outputFile: string,
  filename: string
): Omit<
  BaseChangeDataCaptureConfig,
  'event' | 'filename' | 'functionName' | 'readableTables' | 'writableTables'
> {
  const sourceModelName = type.name;

  const handlerImportName = getArgStringValue('importName', directive);
  const handler = getArgStringValue('importPath', directive);

  const directory = path.join(path.dirname(outputFile), filename);
  const {memorySize, timeout} = HandlerConfigSchema.parse({
    ...config.handlerDefaults,
    ...getOptionalArgObjectValue('handlerConfig', directive),
  });

  const nestedStackLocation = './cdc.yml';

  return {
    actionsModuleId: resolveActionsModuleId(config, directory),
    directory,
    handlerImportName,
    handlerModuleId: resolveHandlerModuleId(type, directory, handler),
    memorySize,
    nestedStackLocation,
    runtimeModuleId: '@code-like-a-carpenter/foundation-runtime',
    sourceModelName,
    timeout,
  };
}

function extractEnricherConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>,
  directive: ConstDirectiveNode,
  outputFile: string
): ChangeDataCaptureEnricherConfig {
  const event = getEvent(type, directive);
  const sourceModelName = type.name;
  const targetModelName = getArgStringValue('targetModel', directive);

  const filename = `enricher--${kebabCase(
    sourceModelName
  )}--${event.toLowerCase()}--${kebabCase(targetModelName)}`;

  const functionName = makeFunctionName(
    'enricher',
    sourceModelName,
    event,
    targetModelName
  );

  const readableTables = getTargetTables('readableModels', schema, directive);
  const writableTables = Array.from(
    new Set([
      ...getTargetTables('writableModels', schema, directive),
      getTargetTable(schema, type.name, targetModelName),
    ])
  );

  return {
    ...extractCommonConfig(
      config,
      schema,
      type,
      directive,
      outputFile,
      filename
    ),
    event,
    filename,
    functionName,
    readableTables,
    targetModelName,
    type: 'ENRICHER',
    writableTables,
  };
}

function extractReactorConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>,
  directive: ConstDirectiveNode,
  outputFile: string
): ChangeDataCaptureReactorConfig {
  const event = getEvent(type, directive);
  const handlerModuleId = getArgStringValue('importPath', directive);

  const readableTables = getTargetTables('readableModels', schema, directive);
  const writableTables = getTargetTables('writableModels', schema, directive);

  const sourceModelName = type.name;

  const filename = `react--${kebabCase(
    sourceModelName
  )}--${event.toLowerCase()}`;

  const functionName = makeFunctionName('react', sourceModelName, event);

  const directory = path.join(path.dirname(outputFile), filename);

  return {
    ...extractCommonConfig(
      config,
      schema,
      type,
      directive,
      outputFile,
      filename
    ),
    event,
    filename,
    functionName,
    handlerModuleId: resolveHandlerModuleId(type, directory, handlerModuleId),
    readableTables,
    sourceModelName: type.name,
    type: 'REACTOR',
    writableTables,
  };
}

function extractReducerConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>,
  directive: ConstDirectiveNode,
  outputFile: string
): ChangeDataCaptureReducerConfig {
  const event = getEvent(type, directive);
  const handlerModuleId = getArgStringValue('importPath', directive);

  const readableTables = getTargetTables('readableModels', schema, directive);
  const writableTables = getTargetTables('writableModels', schema, directive);

  const sourceModelName = type.name;

  const filename = `reduce--${kebabCase(
    sourceModelName
  )}--${event.toLowerCase()}`;

  const functionName = makeFunctionName('reduce', sourceModelName, event);

  const directory = path.join(path.dirname(outputFile), filename);

  return {
    ...extractCommonConfig(
      config,
      schema,
      type,
      directive,
      outputFile,
      filename
    ),
    event,
    filename,
    functionName,
    handlerModuleId: resolveHandlerModuleId(type, directory, handlerModuleId),
    readableTables,
    sourceModelName: type.name,
    type: 'REDUCER',
    writableTables,
  };
}

function getEvent(
  type: GraphQLObjectType<unknown, unknown>,
  directive: ConstDirectiveNode
) {
  const event = getArgEnumValue('event', directive);
  assert(
    event === 'INSERT' ||
      event === 'MODIFY' ||
      event === 'REMOVE' ||
      event === 'UPSERT',
    `Invalid event type ${event} for @${directive.name.value} on ${type.name}`
  );
  return event;
}

function makeFunctionName(
  prefix: string,
  sourceModelName: string,
  event: string,
  targetModelName = ''
) {
  const sourceAbbr = abbreviate(sourceModelName);
  const targetAbbr = abbreviate(targetModelName);

  const rand = crypto
    .createHash('sha1')
    .update(sourceModelName + event + targetModelName)
    .digest('hex')
    .slice(0, 8);

  const functionName = `Fn${upperFirst(
    camelCase(
      [prefix, sourceAbbr, event, targetAbbr].filter(filterNull).join('--')
    )
  )}${rand}`;

  assert(
    functionName.length <= 64,
    `Handler function name must be less than 64 characters: ${functionName}`
  );

  return functionName;
}

function abbreviate(str: string) {
  return snakeCase(str)
    .split('_')
    .map((c) => c[0])
    .join('-');
}
