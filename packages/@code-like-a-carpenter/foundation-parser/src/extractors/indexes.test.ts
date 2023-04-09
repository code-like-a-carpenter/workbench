import {parseSchema} from '../test-helpers';

describe('@lsi', () => {
  it('adds a single-field LSI to a single-field primary key', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @lsi(name: "lsi1", skFields: ["x"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "lsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": true,
          "partitionKeyName": "pk",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          ],
          "sortKeyIsSingleField": true,
          "sortKeyName": "x",
          "sortKeyPrefix": "",
          "type": "lsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('adds a single-field LSI to a multi-field primary key', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a", "b"])
        @lsi(name: "lsi1", skFields: ["x"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "lsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
            {
              "columnName": "b",
              "columnNamesForRead": [
                "b",
                "b",
              ],
              "computeFunction": undefined,
              "ean": ":b",
              "eav": "#b",
              "fieldName": "b",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": false,
          "partitionKeyName": "pk",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          ],
          "sortKeyIsSingleField": true,
          "sortKeyName": "x",
          "sortKeyPrefix": "",
          "type": "lsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('adds a multi-field LSI to a single-field primary key', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @lsi(name: "lsi1", skFields: ["x", "y"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "lsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": true,
          "partitionKeyName": "pk",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          "sortKeyName": "lsi1sk",
          "sortKeyPrefix": "",
          "type": "lsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('adds a multi-field LSI to a multi-field primary key', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a", "b"])
        @lsi(name: "lsi1", skFields: ["x", "y"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "lsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
            {
              "columnName": "b",
              "columnNamesForRead": [
                "b",
                "b",
              ],
              "computeFunction": undefined,
              "ean": ":b",
              "eav": "#b",
              "fieldName": "b",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": false,
          "partitionKeyName": "pk",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          "sortKeyName": "lsi1sk",
          "sortKeyPrefix": "",
          "type": "lsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });
});

describe('@gsi', () => {
  it('defines a simple, single-field GSI', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @gsi(name: "gsi1", pkFields: ["a"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": false,
          "isSingleField": true,
          "name": "gsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyName": "a",
          "partitionKeyPrefix": "",
          "projectionType": "all",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('defines a simple, multi-field GSI', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @gsi(name: "gsi1", pkFields: ["a", "b"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": false,
          "isSingleField": false,
          "name": "gsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
            {
              "columnName": "b",
              "columnNamesForRead": [
                "b",
                "b",
              ],
              "computeFunction": undefined,
              "ean": ":b",
              "eav": "#b",
              "fieldName": "b",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyName": "gsi1pk",
          "partitionKeyPrefix": "",
          "projectionType": "all",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('defines a composite, single-pk, single-sk GSI', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @gsi(name: "gsi1", pkFields: ["a"], skFields: ["x"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "gsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": true,
          "partitionKeyName": "a",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          ],
          "sortKeyIsSingleField": true,
          "sortKeyName": "x",
          "sortKeyPrefix": "",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('defines a composite, single-pk, multi-sk GSI', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @gsi(name: "gsi1", pkFields: ["a"], skFields: ["x", "y"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "gsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": true,
          "partitionKeyName": "a",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          "sortKeyName": "gsi1sk",
          "sortKeyPrefix": "",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('defines a composite, multi-pk, single-sk GSI', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @gsi(name: "gsi1", pkFields: ["a", "b"], skFields: ["x"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "gsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
            {
              "columnName": "b",
              "columnNamesForRead": [
                "b",
                "b",
              ],
              "computeFunction": undefined,
              "ean": ":b",
              "eav": "#b",
              "fieldName": "b",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": false,
          "partitionKeyName": "gsi1pk",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          ],
          "sortKeyIsSingleField": true,
          "sortKeyName": "x",
          "sortKeyPrefix": "",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('defines a composite, multi-pk, multi-sk GSI', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"])
        @gsi(name: "gsi1", pkFields: ["a", "b"], skFields: ["x", "y"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": true,
          "name": "gsi1",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
            {
              "columnName": "b",
              "columnNamesForRead": [
                "b",
                "b",
              ],
              "computeFunction": undefined,
              "ean": ":b",
              "eav": "#b",
              "fieldName": "b",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyIsSingleField": false,
          "partitionKeyName": "gsi1pk",
          "partitionKeyPrefix": "",
          "projectionType": "all",
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
          "sortKeyName": "gsi1sk",
          "sortKeyPrefix": "",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });
});

describe('@simpleIndex', () => {
  it('defines a simple, single-field GSI', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String! @simpleIndex
        b: String!
        x: String!
        y: String!
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": false,
          "isSingleField": true,
          "name": "a",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyName": "a",
          "projectionType": "all",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });

  it('is repeatable', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["a"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String! @simpleIndex
        b: String! @simpleIndex
        x: String! @simpleIndex
        y: String! @simpleIndex
      }
    `;

    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": false,
          "isSingleField": true,
          "name": "a",
          "partitionKeyFields": [
            {
              "columnName": "a",
              "columnNamesForRead": [
                "a",
                "a",
              ],
              "computeFunction": undefined,
              "ean": ":a",
              "eav": "#a",
              "fieldName": "a",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyName": "a",
          "projectionType": "all",
          "type": "gsi",
        },
        {
          "isComposite": false,
          "isSingleField": true,
          "name": "b",
          "partitionKeyFields": [
            {
              "columnName": "b",
              "columnNamesForRead": [
                "b",
                "b",
              ],
              "computeFunction": undefined,
              "ean": ":b",
              "eav": "#b",
              "fieldName": "b",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyName": "b",
          "projectionType": "all",
          "type": "gsi",
        },
        {
          "isComposite": false,
          "isSingleField": true,
          "name": "x",
          "partitionKeyFields": [
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
          ],
          "partitionKeyName": "x",
          "projectionType": "all",
          "type": "gsi",
        },
        {
          "isComposite": false,
          "isSingleField": true,
          "name": "y",
          "partitionKeyFields": [
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
          "partitionKeyName": "y",
          "projectionType": "all",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(4);
    expect(parsed).toMatchSnapshot();
  });
});

describe('PublicModel', () => {
  it('automatically indexes the publicId field', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned & PublicModel
        @partitionKey(pkFields: ["a"]) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        a: String!
        b: String!
        x: String!
        y: String!
        publicId: String!
      }
    `;
    const parsed = await parseSchema(schema);
    expect(parsed.models[0].secondaryIndexes).toMatchInlineSnapshot(`
      [
        {
          "isComposite": false,
          "isSingleField": true,
          "name": "publicId",
          "partitionKeyFields": [
            {
              "columnName": "publicId",
              "columnNamesForRead": [
                "publicId",
              ],
              "computeFunction": undefined,
              "ean": ":publicId",
              "eav": "#publicId",
              "fieldName": "publicId",
              "isDateType": false,
              "isRequired": true,
              "isScalarType": true,
              "typeName": "String",
            },
          ],
          "partitionKeyName": "publicId",
          "projectionType": "all",
          "type": "gsi",
        },
      ]
    `);
    expect(parsed.models[0].secondaryIndexes).toHaveLength(1);
    expect(parsed).toMatchSnapshot();
  });
});
