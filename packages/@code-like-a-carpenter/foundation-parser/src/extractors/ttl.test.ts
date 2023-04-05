import {parseSchema} from '../test-helpers';

import {convertDuration} from './ttl';

describe('@ttl', () => {
  it('marks a fields as the ttl field', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["id"]) {
        createdAt: Date!
        expires: Date! @ttl
        id: ID!
        updatedAt: Date!
        version: Int!
      }
    `;

    const parsed = await parseSchema(schema);

    expect(parsed.tables[0].hasTtl).toBe(true);

    const [{ttlConfig}] = parsed.models;
    expect(ttlConfig).toBeDefined();
    expect(ttlConfig?.argumentAllowed).toBe(true);
    expect(ttlConfig?.argumentRequired).toBe(true);

    expect(parsed.models[0].ttlConfig).toMatchInlineSnapshot(`
      {
        "argumentAllowed": true,
        "argumentRequired": true,
        "fieldName": "expires",
      }
    `);
    expect(parsed).toMatchSnapshot();
  });

  it('expires a record after a specified duration', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["id"]) {
        createdAt: Date!
        expires: Date! @ttl(duration: "1d")
        id: ID!
        updatedAt: Date!
        version: Int!
      }
    `;

    const parsed = await parseSchema(schema);

    expect(parsed.tables[0].hasTtl).toBe(true);

    const [{ttlConfig}] = parsed.models;
    expect(ttlConfig).toBeDefined();
    expect(ttlConfig?.argumentAllowed).toBe(false);
    expect(ttlConfig?.argumentRequired).toBe(false);

    expect(parsed.models[0].ttlConfig).toMatchInlineSnapshot(`
      {
        "argumentAllowed": false,
        "argumentRequired": false,
        "duration": 86400000,
        "fieldName": "expires",
      }
    `);
    expect(parsed).toMatchSnapshot();
  });

  it('optionally allows the end-user to specify an alternative expiration', async () => {
    const schema = /* GraphQL */ `
      type Example implements Model & Timestamped & Versioned
        @partitionKey(pkFields: ["id"]) {
        createdAt: Date!
        expires: Date! @ttl(duration: "1d", overridable: true)
        id: ID!
        updatedAt: Date!
        version: Int!
      }
    `;

    const parsed = await parseSchema(schema);

    expect(parsed.tables[0].hasTtl).toBe(true);

    const [{ttlConfig}] = parsed.models;
    expect(ttlConfig).toBeDefined();

    expect(ttlConfig?.argumentAllowed).toBe(true);
    expect(ttlConfig?.argumentRequired).toBe(false);

    expect(parsed.models[0].ttlConfig).toMatchInlineSnapshot(`
      {
        "argumentAllowed": true,
        "argumentRequired": false,
        "duration": 86400000,
        "fieldName": "expires",
      }
    `);
    expect(parsed).toMatchSnapshot();
  });
});

describe('convertDuration()', () => {
  it('converts a duration string to milliseconds', () => {
    expect(convertDuration('1s')).toBe(1000);
    expect(convertDuration('1m')).toBe(60000);
    expect(convertDuration('1h')).toBe(3600000);
    expect(convertDuration('1d')).toBe(86400000);
  });
});
