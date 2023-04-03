import assert from 'assert';

import type {
  ConstDirectiveNode,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import {assertObjectType} from 'graphql';

import type {
  ChangeDataCaptureConfig,
  ChangeDataCaptureEnricherConfig,
  ChangeDataCaptureTriggerConfig,
  DispatcherConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {DispatcherConfigSchema} from '../config';
import {
  filterNull,
  getArgEnumValue,
  getArgStringValue,
  getOptionalArg,
  getOptionalArgObjectValue,
} from '../helpers';
import {extractTableName} from '../tables';

import {extractHandlerConfig} from './lambda-config';

export function extractDispatcherConfig(
  config: Config,
  type: GraphQLObjectType
): DispatcherConfig {
  assert(
    type?.astNode?.directives,
    `Expected to find at least one directive on type ${type.name}`
  );

  const {memorySize, timeout} = type.astNode.directives
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
    memorySize,
    timeout,
  };
}

/** Extracts CDC config for a type */
export function extractChangeDataCaptureConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>
): ChangeDataCaptureConfig[] {
  return (
    type.astNode?.directives
      ?.map((directive) => {
        if (directive.name.value === 'enriches') {
          return extractEnricherConfig(config, schema, type, directive);
        }
        if (directive.name.value === 'triggers') {
          return extractTriggersConfig(config, schema, type, directive);
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

function extractEnricherConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>,
  directive: ConstDirectiveNode
): ChangeDataCaptureEnricherConfig {
  const event = getEvent(type, directive);
  const handlerModuleId = getArgStringValue('handler', directive);

  const targetModelName = getArgStringValue('targetModel', directive);
  return {
    dispatcherConfig: extractDispatcherConfig(config, type),
    event,
    handlerConfig: extractHandlerConfig(config, directive),
    handlerModuleId,
    sourceModelName: type.name,
    targetModelName,
    type: 'ENRICHER',
    writableTables: [getTargetTable(schema, type.name, targetModelName)],
  };
}

function extractTriggersConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType<unknown, unknown>,
  directive: ConstDirectiveNode
): ChangeDataCaptureTriggerConfig {
  const event = getEvent(type, directive);
  const handlerModuleId = getArgStringValue('handler', directive);

  const readableTables = getTargetTables('readableModels', schema, directive);

  const writableTables = getTargetTables('writableModels', schema, directive);

  return {
    dispatcherConfig: extractDispatcherConfig(config, type),
    event,
    handlerConfig: extractHandlerConfig(config, directive),
    handlerModuleId,
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
