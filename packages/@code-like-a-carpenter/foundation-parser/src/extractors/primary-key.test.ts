import {parseSchema} from '../test-helpers';

describe('@partitionKey', () => {
  it('defines simple primary keys', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["id"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].primaryKey).toMatchInlineSnapshot(`
      {
        "isComposite": false,
        "isSingleField": true,
        "partitionKeyFields": [
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
        ],
        "partitionKeyName": "pk",
        "partitionKeyPrefix": "",
        "type": "primary",
      }
    `);
    expect(parsed.models[0].primaryKey.isComposite).toBe(false);
    expect(parsed).toMatchSnapshot();
  });

  it('defines multi-field simple primary keys', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["vendor", "externalId"]) {
        createdAt: Date!
        externalId: String!
        id: ID!
        updatedAt: Date!
        version: Int!
        vendor: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].primaryKey).toMatchInlineSnapshot(`
      {
        "isComposite": false,
        "isSingleField": false,
        "partitionKeyFields": [
          {
            "columnName": "vendor",
            "columnNamesForRead": [
              "vendor",
              "vendor",
            ],
            "computeFunction": undefined,
            "ean": ":vendor",
            "eav": "#vendor",
            "fieldName": "vendor",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
          {
            "columnName": "external_id",
            "columnNamesForRead": [
              "external_id",
              "externalId",
            ],
            "computeFunction": undefined,
            "ean": ":externalId",
            "eav": "#externalId",
            "fieldName": "externalId",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "partitionKeyName": "pk",
        "partitionKeyPrefix": "",
        "type": "primary",
      }
    `);
    expect(parsed.models[0].primaryKey.isComposite).toBe(false);
    expect(parsed).toMatchSnapshot();
  });
});

describe('@compositeKey', () => {
  it('defines composite primary keys', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @compositeKey(pkFields: ["vendor"], skFields: ["externalId"]) {
        createdAt: Date!
        externalId: String!
        id: ID!
        updatedAt: Date!
        version: Int!
        vendor: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].primaryKey).toMatchInlineSnapshot(`
      {
        "isComposite": true,
        "partitionKeyFields": [
          {
            "columnName": "vendor",
            "columnNamesForRead": [
              "vendor",
              "vendor",
            ],
            "computeFunction": undefined,
            "ean": ":vendor",
            "eav": "#vendor",
            "fieldName": "vendor",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "partitionKeyIsSingleField": true,
        "partitionKeyName": "pk",
        "partitionKeyPrefix": "",
        "sortKeyFields": [
          {
            "columnName": "external_id",
            "columnNamesForRead": [
              "external_id",
              "externalId",
            ],
            "computeFunction": undefined,
            "ean": ":externalId",
            "eav": "#externalId",
            "fieldName": "externalId",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "sortKeyIsSingleField": true,
        "sortKeyName": "sk",
        "sortKeyPrefix": "",
        "type": "primary",
      }
    `);
    expect(parsed.models[0].primaryKey.isComposite).toBe(true);
    expect(parsed).toMatchSnapshot();
  });

  it('defines multi-field composite primary keys', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @compositeKey(
          pkFields: ["vendor", "externalId"]
          skFields: ["x", "y"]
        ) {
        createdAt: Date!
        externalId: String!
        id: ID!
        updatedAt: Date!
        version: Int!
        vendor: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].primaryKey).toMatchInlineSnapshot(`
      {
        "isComposite": true,
        "partitionKeyFields": [
          {
            "columnName": "vendor",
            "columnNamesForRead": [
              "vendor",
              "vendor",
            ],
            "computeFunction": undefined,
            "ean": ":vendor",
            "eav": "#vendor",
            "fieldName": "vendor",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
          {
            "columnName": "external_id",
            "columnNamesForRead": [
              "external_id",
              "externalId",
            ],
            "computeFunction": undefined,
            "ean": ":externalId",
            "eav": "#externalId",
            "fieldName": "externalId",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "partitionKeyIsSingleField": false,
        "partitionKeyName": "pk",
        "partitionKeyPrefix": "",
        "sortKeyFields": [
          {
            "columnName": "x",
            "columnNamesForRead": [
              "x",
              "x",
            ],
            "computeFunction": undefined,
            "ean": ":x",
            "eav": "#x",
            "fieldName": "x",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
          {
            "columnName": "y",
            "columnNamesForRead": [
              "y",
              "y",
            ],
            "computeFunction": undefined,
            "ean": ":y",
            "eav": "#y",
            "fieldName": "y",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "sortKeyIsSingleField": false,
        "sortKeyName": "sk",
        "sortKeyPrefix": "",
        "type": "primary",
      }
    `);
    expect(parsed.models[0].primaryKey.isComposite).toBe(true);
    expect(parsed).toMatchSnapshot();
  });

  it('defines multi-field composite primary keys with single-field partition key', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @compositeKey(pkFields: ["externalId"], skFields: ["x", "y"]) {
        createdAt: Date!
        externalId: String!
        id: ID!
        updatedAt: Date!
        version: Int!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].primaryKey).toMatchInlineSnapshot(`
      {
        "isComposite": true,
        "partitionKeyFields": [
          {
            "columnName": "external_id",
            "columnNamesForRead": [
              "external_id",
              "externalId",
            ],
            "computeFunction": undefined,
            "ean": ":externalId",
            "eav": "#externalId",
            "fieldName": "externalId",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "partitionKeyIsSingleField": true,
        "partitionKeyName": "pk",
        "partitionKeyPrefix": "",
        "sortKeyFields": [
          {
            "columnName": "x",
            "columnNamesForRead": [
              "x",
              "x",
            ],
            "computeFunction": undefined,
            "ean": ":x",
            "eav": "#x",
            "fieldName": "x",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
          {
            "columnName": "y",
            "columnNamesForRead": [
              "y",
              "y",
            ],
            "computeFunction": undefined,
            "ean": ":y",
            "eav": "#y",
            "fieldName": "y",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "sortKeyIsSingleField": false,
        "sortKeyName": "sk",
        "sortKeyPrefix": "",
        "type": "primary",
      }
    `);
    expect(parsed.models[0].primaryKey.isComposite).toBe(true);
    expect(parsed).toMatchSnapshot();
  });

  it('defines multi-field composite primary keys with single-field sort key', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @compositeKey(pkFields: ["vendor", "externalId"], skFields: ["y"]) {
        createdAt: Date!
        externalId: String!
        id: ID!
        updatedAt: Date!
        version: Int!
        vendor: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].primaryKey).toMatchInlineSnapshot(`
      {
        "isComposite": true,
        "partitionKeyFields": [
          {
            "columnName": "vendor",
            "columnNamesForRead": [
              "vendor",
              "vendor",
            ],
            "computeFunction": undefined,
            "ean": ":vendor",
            "eav": "#vendor",
            "fieldName": "vendor",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
          {
            "columnName": "external_id",
            "columnNamesForRead": [
              "external_id",
              "externalId",
            ],
            "computeFunction": undefined,
            "ean": ":externalId",
            "eav": "#externalId",
            "fieldName": "externalId",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "partitionKeyIsSingleField": false,
        "partitionKeyName": "pk",
        "partitionKeyPrefix": "",
        "sortKeyFields": [
          {
            "columnName": "y",
            "columnNamesForRead": [
              "y",
              "y",
            ],
            "computeFunction": undefined,
            "ean": ":y",
            "eav": "#y",
            "fieldName": "y",
            "isDateType": false,
            "isRequired": true,
            "isScalarType": true,
            "typeName": "String",
          },
        ],
        "sortKeyIsSingleField": true,
        "sortKeyName": "sk",
        "sortKeyPrefix": "",
        "type": "primary",
      }
    `);
    expect(parsed.models[0].primaryKey.isComposite).toBe(true);
    expect(parsed).toMatchSnapshot();
  });

  it('defines a composite primary key with no sort key fields', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @compositeKey(pkFields: ["id"], skFields: []) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].primaryKey).toMatchInlineSnapshot(`
      {
        "isComposite": true,
        "partitionKeyFields": [
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
        ],
        "partitionKeyIsSingleField": true,
        "partitionKeyName": "pk",
        "partitionKeyPrefix": "",
        "sortKeyFields": [],
        "sortKeyIsSingleField": false,
        "sortKeyName": "sk",
        "sortKeyPrefix": "",
        "type": "primary",
      }
    `);
    expect(parsed.models[0].primaryKey.isComposite).toBe(true);
    expect(parsed).toMatchSnapshot();
  });
});
