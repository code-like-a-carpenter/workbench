import assert from 'assert';
import crypto from 'node:crypto';
import path from 'node:path';

import type {
  ConstDirectiveNode,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import {camelCase, kebabCase, snakeCase, upperFirst} from 'lodash';

import type {
  BaseChangeDataCaptureConfig,
  ChangeDataCaptureConfig,
  ChangeDataCaptureEnricherConfig,
  ChangeDataCaptureReactorConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {DispatcherConfigSchema, HandlerConfigSchema} from '../config';
import {
  filterNull,
  getArgEnumValue,
  getArgStringValue,
  getOptionalArgObjectValue,
} from '../helpers';

export function extractDispatcherConfig(
  config: Config,
  type: GraphQLInterfaceType | GraphQLObjectType,
  tableName: string,
  model: Model,
  outputFile: string
) {
  const filename = `dispatcher-${kebabCase(tableName)}`;
  const functionName = `${tableName}CDCDispatcher`;
  const directory = path.join(path.dirname(outputFile), filename);

  // FIXME this needs to be smarter about finall all the directives
  const directive = type.astNode?.directives?.find(
    (d) => d.name.value === 'reacts' || d.name.value === 'enriches'
  );
  assert(directive, 'Expected to find a @reacts or @enriches directive');

  const {batchSize, maximumRetryAttempts, memorySize, timeout} =
    DispatcherConfigSchema.parse({
      ...config.handlerDefaults,
      ...getOptionalArgObjectValue('dispatcherConfig', directive),
    });

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
  type: GraphQLInterfaceType | GraphQLObjectType,
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

        return null;
      })
      .filter(filterNull) ?? []
  );
}

function extractCommonConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType,
  directive: ConstDirectiveNode,
  outputFile: string,
  functionName: string,
  filename: string
): Omit<BaseChangeDataCaptureConfig, 'event' | 'filename' | 'functionName'> {
  const sourceModelName = type.name;

  const handlerImportName = getArgStringValue('handlerImportName', directive);
  const handlerPath = getArgStringValue('handlerPath', directive);

  const {memorySize, timeout} = HandlerConfigSchema.parse({
    ...config.handlerDefaults,
    ...getOptionalArgObjectValue('handlerConfig', directive),
  });

  const directory = path.join(path.dirname(outputFile), filename);

  return {
    actionsModuleId: resolveActionsModuleId(config, directory),
    directory,
    handlerImportName,
    handlerModuleId: resolveHandlerModuleId(type, directory, handlerPath),
    memorySize,
    runtimeModuleId: '@code-like-a-carpenter/foundation-runtime',
    sourceModelName,
    timeout,
  };
}

/** helper */
function extractEnricherConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType,
  directive: ConstDirectiveNode,
  outputFile: string
): ChangeDataCaptureEnricherConfig {
  const event = getEvent(type, directive);
  const targetModelName = getArgStringValue('targetModel', directive);
  const sourceModelName = type.name;

  const filename = `enricher--${kebabCase(
    sourceModelName
  )}--${event.toLowerCase()}`;

  const functionName = `Fn${upperFirst(
    camelCase(
      `enricher--${snakeCase(sourceModelName)
        .split('_')
        .map((c) => c[0])
        .join('-')}--${event}`
    )
  )}${crypto
    .createHash('sha1')
    .update(sourceModelName + event)
    .digest('hex')
    .slice(0, 8)}`;
  assert(
    functionName.length <= 64,
    `Handler function name must be less than 64 characters: ${functionName}`
  );

  return {
    ...extractCommonConfig(
      config,
      schema,
      type,
      directive,
      outputFile,
      functionName,
      filename
    ),
    event,
    filename,
    functionName,
    targetModelName,
    type: 'ENRICHER',
  };
}

/** helper */
function extractReactorConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType,
  directive: ConstDirectiveNode,
  outputFile: string
): ChangeDataCaptureReactorConfig {
  const event = getEvent(type, directive);
  const sourceModelName = type.name;

  const filename = `reactor--${kebabCase(
    sourceModelName
  )}--${event.toLowerCase()}`;

  const functionName = `Fn${upperFirst(
    camelCase(
      `reactor--${snakeCase(sourceModelName)
        .split('_')
        .map((c) => c[0])
        .join('-')}--${event}`
    )
  )}${crypto
    .createHash('sha1')
    .update(sourceModelName + event)
    .digest('hex')
    .slice(0, 8)}`;

  assert(
    functionName.length <= 64,
    `Handler function name must be less than 64 characters: ${functionName}`
  );

  return {
    ...extractCommonConfig(
      config,
      schema,
      type,
      directive,
      outputFile,
      functionName,
      filename
    ),
    event,
    filename,
    functionName,
    type: 'REACTOR',
  };
}

/** helper */
function getEvent(
  type: GraphQLInterfaceType | GraphQLObjectType,
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

function resolveActionsModuleId(config: Config, directory: string) {
  if (config.actionsModuleId.startsWith('.')) {
    const resolved = path.relative(directory, config.actionsModuleId);
    return resolved.replace(new RegExp(`${path.extname(resolved)}$`), '');
  }
  return config.actionsModuleId;
}

function resolveDependenciesModuleId(config: Config, directory: string) {
  if (config.dependenciesModuleId.startsWith('.')) {
    return path.relative(directory, config.dependenciesModuleId);
  }
  return config.dependenciesModuleId;
}

function resolveHandlerModuleId(
  type: GraphQLInterfaceType | GraphQLObjectType,
  directory: string,
  handler: string
) {
  if (!handler.startsWith('.')) {
    return handler;
  }

  const schemaFile = type.astNode?.loc?.source.name;
  assert(schemaFile, `Expected to find a location for the type${type.name}`);

  const absolutePathToHandler = path.join(path.dirname(schemaFile), handler);
  const absolutePathToDirectory = path.resolve(directory);
  const rel = path.relative(absolutePathToDirectory, absolutePathToHandler);

  return rel;
}
