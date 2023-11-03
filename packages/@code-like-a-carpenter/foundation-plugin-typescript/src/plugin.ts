import assert from 'assert';

import type {PluginFunction} from '@graphql-codegen/plugin-helpers';

import {parse} from '@code-like-a-carpenter/foundation-parser';
import {makePlugin} from '@code-like-a-carpenter/graphql-codegen-helpers';

import type {Config} from './config';
import {ConfigSchema} from './config';
import {filterNull} from './helpers';
import {blindWriteTemplate} from './tables/templates/blind-write';
import {createItemTemplate} from './tables/templates/create-item';
import {deleteItemTemplate} from './tables/templates/delete-item';
import {marshallTpl} from './tables/templates/marshall';
import {queryTemplate} from './tables/templates/query';
import {readItemTemplate} from './tables/templates/read-item';
import {unmarshallTpl} from './tables/templates/unmarshall';
import {updateItemTemplate} from './tables/templates/update-item';

export {schema as addToSchema} from '@code-like-a-carpenter/foundation-intermediate-representation';

/** @override */
export const plugin: PluginFunction<Config> = makePlugin(
  ConfigSchema,
  (schema, documents, config, info) => {
    try {
      const {additionalImports, dependenciesModuleId, tables, models} = parse(
        schema,
        documents,
        config,
        info
      );
      const content = `


${models
  .map((model) => {
    const hasPublicIdInPrimaryKey =
      model.primaryKey.partitionKeyFields.some(
        (field) => field.fieldName === 'publicId'
      ) ||
      ('sortKeyFields' in model.primaryKey
        ? model.primaryKey.sortKeyFields.some(
            (field) => field.fieldName === 'publicId'
          )
        : false);

    if (hasPublicIdInPrimaryKey) {
      console.warn(
        `Model ${model.typeName} has a publicId in its primary key and therefore blindWrite is not supported.`
      );
    }

    return [
      `export type ${model.typeName}PrimaryKey = Pick<${
        model.typeName
      }, ${(model.primaryKey.isComposite
        ? [
            ...model.primaryKey.partitionKeyFields,
            ...model.primaryKey.sortKeyFields,
          ]
        : model.primaryKey.partitionKeyFields
      )
        .map((f) => `'${f.fieldName}'`)
        .sort()
        .join('|')}>`,
      createItemTemplate(config, model),
      !model.isLedger &&
        !hasPublicIdInPrimaryKey &&
        blindWriteTemplate(config, model),
      !model.isLedger && deleteItemTemplate(config, model),
      readItemTemplate(config, model),
      !model.isLedger && updateItemTemplate(config, model),
      queryTemplate(model),
      marshallTpl(config, model),
      unmarshallTpl(model),
    ]
      .filter(filterNull)
      .join('\n\n');
  })
  .join('\n')}`;

      assert(info?.outputFile, 'info.outputFile is required');

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
            DeleteCommand,
            DeleteCommandInput,
            GetCommand,
            GetCommandInput,
            QueryCommand,
            QueryCommandInput,
            UpdateCommand,
            UpdateCommandInput
          } from '@aws-sdk/lib-dynamodb';`,
          `import {ServiceException} from '@aws-sdk/smithy-client';`,
          `import {NativeAttributeValue} from '@aws-sdk/util-dynamodb';`,
          `import Base64 from 'base64url';`,
          `import {assert} from '@code-like-a-carpenter/assert';`,
          `import {
            makeSortKeyForQuery,
            unmarshallRequiredField,
            unmarshallOptionalField,
            unpackTableNames,
            AlreadyExistsError,
            BaseDataLibraryError,
            DataIntegrityError,
            MultiResultType,
            NotFoundError,
            OptimisticLockingError,
            ResultType,
            QueryOptions,
            UnexpectedAwsError,
            UnexpectedError
          } from '${runtimeModuleId}';`,
          `import {${importFromDependencies}} from "${dependenciesModuleId}";`,
          ...additionalImports.map(
            ({importName, importPath}) =>
              `import {${importName}} from '${importPath}';`
          ),
        ],
      };
    } catch (err) {
      // graphql-codegen suppresses stack traces, so we have to re-log here.
      console.error(err);
      throw err;
    }
  }
);
