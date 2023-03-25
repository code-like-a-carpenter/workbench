import type {PluginFunction} from '@graphql-codegen/plugin-helpers';

import {parse} from '@code-like-a-carpenter/foundation-parser';
import {logGraphQLCodegenPluginErrors} from '@code-like-a-carpenter/graphql-codegen-helpers';

import type {Config} from './config';
import {TypescriptPluginConfigSchema} from './config';
import {filterNull} from './helpers';
import {createItemTpl} from './templates/create-item';
import {marshallTpl} from './templates/marshall';
import {unmarshallTpl} from './templates/unmarshall';

export const plugin: PluginFunction<Config> = logGraphQLCodegenPluginErrors(
  (schema, documents, config, info) => {
    const configWithDefaults = TypescriptPluginConfigSchema.parse(config);
    const {dependenciesModuleId, models, tables} = parse(
      schema,
      documents,
      configWithDefaults,
      info
    );

    const content = models
      .map((model) => [
        createItemTpl(config, model),
        marshallTpl(model),
        unmarshallTpl(model),
      ])
      .flat()
      .join('\n');

    const runtimeModuleId = '@code-like-a-carpenter/foundation-runtime';

    const hasPublicModels = tables.some((table) => table.hasPublicModels);

    const importFromDependencies = [
      'ddbDocClient',
      hasPublicModels && 'idGenerator',
    ]
      .filter(filterNull)
      .join(', ');

    return {
      content,
      prepend: [
        `import {AssertionError} from 'node:assert';`,
        `import {ConditionalCheckFailedException} from '@aws-sdk/client-dynamodb';`,
        `import {
          UpdateCommand,
          UpdateCommandInput
        } from '@aws-sdk/lib-dynamodb';`,
        `import {ServiceException} from '@aws-sdk/smithy-client';`,
        `import {assert} from '@code-like-a-carpenter/assert';`,
        `import {NativeAttributeValue} from '@aws-sdk/util-dynamodb';`,
        `import Base64 from 'base64url';`,
        `import {
          unmarshallRequiredField,
          unmarshallOptionalField,
          AlreadyExistsError,
          BaseDataLibraryError,
          DataIntegrityError,
          ResultType,
          UnexpectedAwsError,
          UnexpectedError
        } from '${runtimeModuleId}';`,
        `import {${importFromDependencies}} from "${dependenciesModuleId}";`,
      ],
    };
  }
);
