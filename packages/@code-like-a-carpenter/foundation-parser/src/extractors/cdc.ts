import assert from 'assert';
import path from 'node:path';

import type {
  ConstDirectiveNode,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import {kebabCase} from 'lodash';

import type {
  ChangeDataCaptureConfig,
  ChangeDataCaptureEnricherConfig,
  ChangeDataCaptureReactorConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {DispatcherConfigSchema} from '../config';
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
  type: GraphQLInterfaceType | GraphQLObjectType
): ChangeDataCaptureConfig[] {
  return (
    type.astNode?.directives
      ?.map((directive) => {
        if (directive.name.value === 'enriches') {
          return extractEnricherConfig(config, schema, type, directive);
        }
        if (directive.name.value === 'reacts') {
          return extractReactorConfig(config, schema, type, directive);
        }

        return null;
      })
      .filter(filterNull) ?? []
  );
}

/** helper */
function extractEnricherConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType,
  directive: ConstDirectiveNode
): ChangeDataCaptureEnricherConfig {
  const event = getEvent(type, directive);

  const targetModelName = getArgStringValue('targetModel', directive);
  return {
    event,
    sourceModelName: type.name,
    targetModelName,
    type: 'ENRICHER',
  };
}

/** helper */
function extractReactorConfig(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType,
  directive: ConstDirectiveNode
): ChangeDataCaptureReactorConfig {
  const event = getEvent(type, directive);

  return {
    event,
    sourceModelName: type.name,
    type: 'TRIGGER',
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

function resolveDependenciesModuleId(config: Config, directory: string) {
  if (config.dependenciesModuleId.startsWith('.')) {
    return path.relative(directory, config.dependenciesModuleId);
  }
  return config.dependenciesModuleId;
}
