import {readFileSync} from 'fs';
import path from 'node:path';

import type {AddToSchemaResult} from '@graphql-codegen/plugin-helpers';
import {getCachedDocumentNodeFromSchema} from '@graphql-codegen/plugin-helpers';
import {mergeSchemas} from '@graphql-tools/schema';
import {globSync} from 'glob';
import type {DocumentNode, GraphQLSchema} from 'graphql';
import {
  buildASTSchema,
  extendSchema,
  lexicographicSortSchema,
  parse,
  Source,
} from 'graphql';

function getDocumentNodeFromAddToSchemaResult(
  a: AddToSchemaResult
): DocumentNode {
  if (typeof a === 'string') {
    return parse(a);
  }

  if (typeof a === 'undefined') {
    return parse('');
  }

  return a;
}

function makeInitialSchema(
  addToSchemaResults: AddToSchemaResult[]
): GraphQLSchema {
  const [first, ...rest] = Array.from(new Set(addToSchemaResults));
  return rest.reduce(
    (acc, next) =>
      extendSchema(acc, getDocumentNodeFromAddToSchemaResult(next)),
    buildASTSchema(getDocumentNodeFromAddToSchemaResult(first))
  );
}

export async function loadSchema(
  cwd: string,
  schemaGlob: string | string[],
  addToSchemaResults: AddToSchemaResult[]
): Promise<DocumentNode> {
  const initialSchema = makeInitialSchema(addToSchemaResults);

  const patterns = Array.isArray(schemaGlob) ? schemaGlob : [schemaGlob];
  const files = globSync(patterns, {cwd});

  const sources = files.map(
    (file) => new Source(readFileSync(path.resolve(cwd, file), 'utf8'), file)
  );

  const typeDefs = sources.map((source) => parse(source, {}));

  return getCachedDocumentNodeFromSchema(
    lexicographicSortSchema(
      mergeSchemas({typeDefs: [initialSchema, ...typeDefs]})
    )
  );
}
