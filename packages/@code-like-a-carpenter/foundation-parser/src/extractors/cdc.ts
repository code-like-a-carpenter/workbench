import assert from 'assert';
import path from 'path';

import type {
  ConstDirectiveNode,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import {assertObjectType} from 'graphql';
import {kebabCase} from 'lodash';

import type {
  BaseChangeDataCaptureConfig,
  ChangeDataCaptureConfig,
  ChangeDataCaptureEnricherConfig,
  ChangeDataCaptureTriggerConfig,
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

  return {
    batchSize,
    dependenciesModuleId: resolveDependenciesModuleId(config, directory),
    directory,
    filename,
    functionName,
    maximumRetryAttempts,
    memorySize,
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
        if (directive.name.value === 'triggers') {
          return extractTriggersConfig(
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
): Omit<BaseChangeDataCaptureConfig, 'event' | 'filename'> {
  const sourceModelName = type.name;

  const handler = getArgStringValue('handler', directive);

  const directory = path.join(path.dirname(outputFile), filename);
  const {memorySize, timeout} = HandlerConfigSchema.parse({
    ...config.handlerDefaults,
    ...getOptionalArgObjectValue('handlerConfig', directive),
  });

  return {
    actionsModuleId: resolveActionsModuleId(config, directory),
    handlerModuleId: resolveHandlerModuleId(type, directory, handler),
    memorySize,
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
    targetModelName,
    type: 'ENRICHER',
    writableTables: [getTargetTable(schema, type.name, targetModelName)],
  };
}

function extractTriggersConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>,
  directive: ConstDirectiveNode,
  outputFile: string
): ChangeDataCaptureTriggerConfig {
  const event = getEvent(type, directive);
  const handlerModuleId = getArgStringValue('handler', directive);

  const readableTables = getTargetTables('readableModels', schema, directive);
  const writableTables = getTargetTables('writableModels', schema, directive);

  const sourceModelName = type.name;

  const filename = `trigger--${kebabCase(
    sourceModelName
  )}--${event.toLowerCase()}`;

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
    handlerModuleId: resolveHandlerModuleId(type, directory, handlerModuleId),
    readableTables,
    sourceModelName: type.name,
    type: 'TRIGGER',
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