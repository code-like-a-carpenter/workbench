import {readFile} from 'node:fs/promises';
import * as path from 'node:path';

import {parseSchema} from './test-helpers';

describe('parse()', () => {
  it('parses a schema', async () => {
    const filename = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'examples',
      'user-session',
      'schema',
      'user-session.graphqls'
    );
    const schema = await readFile(filename, 'utf8');

    expect(await parseSchema(schema)).toMatchInlineSnapshot(`
      {
        "models": [
          {
            "consistent": true,
            "fields": [
              {
                "columnName": "_ct",
                "columnNamesForRead": [
                  "_ct",
                ],
                "computeFunction": undefined,
                "ean": ":createdAt",
                "eav": "#createdAt",
                "fieldName": "createdAt",
                "isDateType": true,
                "isRequired": true,
                "isScalarType": true,
                "typeName": "Date",
              },
              {
                "columnName": "ttl",
                "columnNamesForRead": [
                  "ttl",
                ],
                "computeFunction": undefined,
                "ean": ":expires",
                "eav": "#expires",
                "fieldName": "expires",
                "isDateType": true,
                "isRequired": true,
                "isScalarType": true,
                "typeName": "Date",
              },
              {
                "columnName": "id",
                "columnNamesForRead": [
                  "id",
                  "id",
                ],
                "computeFunction": undefined,
                "ean": ":id",
                "eav": "#id",
                "fieldName": "id",
                "isDateType": false,
                "isRequired": true,
                "isScalarType": true,
                "typeName": "ID",
              },
              {
                "columnName": "session_id",
                "columnNamesForRead": [
                  "session_id",
                  "sessionId",
                ],
                "computeFunction": undefined,
                "ean": ":sessionId",
                "eav": "#sessionId",
                "fieldName": "sessionId",
                "isDateType": false,
                "isRequired": true,
                "isScalarType": true,
                "typeName": "String",
              },
              {
                "columnName": "session",
                "columnNamesForRead": [
                  "session",
                  "session",
                ],
                "computeFunction": undefined,
                "ean": ":session",
                "eav": "#session",
                "fieldName": "session",
                "isDateType": false,
                "isRequired": true,
                "isScalarType": true,
                "typeName": "JSONObject",
              },
              {
                "columnName": "_md",
                "columnNamesForRead": [
                  "_md",
                ],
                "computeFunction": undefined,
                "ean": ":updatedAt",
                "eav": "#updatedAt",
                "fieldName": "updatedAt",
                "isDateType": true,
                "isRequired": true,
                "isScalarType": true,
                "typeName": "Date",
              },
              {
                "columnName": "_v",
                "columnNamesForRead": [
                  "_v",
                ],
                "computeFunction": undefined,
                "ean": ":version",
                "eav": "#version",
                "fieldName": "version",
                "isDateType": false,
                "isRequired": true,
                "isScalarType": true,
                "typeName": "Int",
              },
            ],
            "isLedger": false,
            "isPublic": false,
            "primaryKey": {
              "isComposite": false,
              "isSingleField": true,
              "partitionKeyFields": [
                {
                  "columnName": "session_id",
                  "columnNamesForRead": [
                    "session_id",
                    "sessionId",
                  ],
                  "computeFunction": undefined,
                  "ean": ":sessionId",
                  "eav": "#sessionId",
                  "fieldName": "sessionId",
                  "isDateType": false,
                  "isRequired": true,
                  "isScalarType": true,
                  "typeName": "String",
                },
              ],
              "partitionKeyPrefix": "USER_SESSION",
              "type": "primary",
            },
            "secondaryIndexes": [],
            "table": {
              "enableEncryption": true,
              "enablePointInTimeRecovery": true,
              "hasPublicModels": false,
              "hasTtl": true,
              "primaryKey": {
                "isComposite": false,
                "isSingleField": true,
                "partitionKeyFields": [
                  {
                    "columnName": "session_id",
                    "columnNamesForRead": [
                      "session_id",
                      "sessionId",
                    ],
                    "computeFunction": undefined,
                    "ean": ":sessionId",
                    "eav": "#sessionId",
                    "fieldName": "sessionId",
                    "isDateType": false,
                    "isRequired": true,
                    "isScalarType": true,
                    "typeName": "String",
                  },
                ],
                "partitionKeyPrefix": "USER_SESSION",
                "type": "primary",
              },
              "secondaryIndexes": [],
              "tableName": "TableUserSession",
            },
            "ttlConfig": {
              "argumentAllowed": false,
              "argumentRequired": false,
              "duration": 86400000,
              "fieldName": "expires",
            },
            "typeName": "UserSession",
          },
        ],
        "tables": [
          {
            "enableEncryption": true,
            "enablePointInTimeRecovery": true,
            "hasPublicModels": false,
            "hasTtl": true,
            "primaryKey": {
              "isComposite": false,
              "isSingleField": true,
              "partitionKeyFields": [
                {
                  "columnName": "session_id",
                  "columnNamesForRead": [
                    "session_id",
                    "sessionId",
                  ],
                  "computeFunction": undefined,
                  "ean": ":sessionId",
                  "eav": "#sessionId",
                  "fieldName": "sessionId",
                  "isDateType": false,
                  "isRequired": true,
                  "isScalarType": true,
                  "typeName": "String",
                },
              ],
              "partitionKeyPrefix": "USER_SESSION",
              "type": "primary",
            },
            "secondaryIndexes": [],
            "tableName": "TableUserSession",
          },
        ],
      }
    `);
  });
});
