import assert from 'node:assert';

import {parseSchema} from '../test-helpers';

describe('@reacts', () => {
  it('configures an event handler for the model', async () => {
    const schema = /* GraphQL */ `
      """
      A summary of all the accounts on a particular plan.
      """
      type PlanMetric implements Model & Timestamped & Versioned
        # This is a little weird looking, but it's basically a way to allow scans
        # without generally building it in as a feature. This strategy should only be
        # in very small tables where it won't matter that every record is in a single
        # partition. In this case, we're talking about all the plans a startup might
        # offer times 2 for each boolean (cancelled and onFreeTrial), so it's probably
        # less than 20 records. If you find yourself with many more records, you
        # should look at using something other than DynamoDB for aggregating this
        # data.
        @compositeKey(
          pkFields: []
          pkPrefix: "BUSINESS_METRIC"
          skFields: ["onFreeTrial", "planName"]
          skPrefix: "PLAN"
        )
        @triggers(
          event: "UPSERT"
          handler: "../src/react--plan-metric--upsert"
        ) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        cancelled: Boolean!
        count: Int!
        monthlyRecurringRevenueInCents: Int!
        onFreeTrial: Boolean!
        planName: String!
      }
    `;

    const parsed = await parseSchema(schema);

    const [table] = parsed.tables;
    assert(table);
    expect(table.hasCdc).toBe(true);
    assert(table.hasCdc);
    expect(table.dispatcherConfig).toMatchInlineSnapshot(`
      {
        "memorySize": 384,
        "timeout": 90,
      }
    `);

    const [model] = parsed.models;
    assert(model);
    expect(model.changeDataCaptureConfig).toHaveLength(1);
    expect(model.changeDataCaptureConfig).toMatchInlineSnapshot(`
      [
        {
          "dispatcherConfig": {
            "memorySize": 384,
            "timeout": 90,
          },
          "event": "UPSERT",
          "handlerConfig": {
            "memorySize": 256,
            "timeout": 30,
          },
          "handlerModuleId": "../src/react--plan-metric--upsert",
          "readableTables": [],
          "sourceModelName": "PlanMetric",
          "type": "TRIGGER",
          "writableTables": [],
        },
      ]
    `);

    expect(parsed).toMatchSnapshot();
  });
});

describe('@enriches', () => {
  it('configures the handler to update one model when another changes', async () => {
    const schema = /* GraphQL */ `
      """
      A customer account.
      """
      type Account implements Model & Versioned & Timestamped
        @compositeKey(
          pkFields: ["externalId"]
          pkPrefix: "ACCOUNT"
          skFields: []
        ) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        cancelled: Boolean!
        externalId: String!
        planName: String
      }
      """
      An event describing a change to a customer's subscription status.
      """
      type SubscriptionEvent implements Model & Timestamped & Versioned
        @enriches(
          event: "UPSERT"
          handler: "../src/enrich--subscription--upsert--account"
          targetModel: "Account"
        )
        @ledger
        @compositeKey(
          pkFields: ["externalId"]
          pkPrefix: "ACCOUNT"
          skFields: ["effectiveDate"]
          skPrefix: "SUBSCRIPTION_EVENT"
        ) {
        createdAt: Date!
        id: ID!
        updatedAt: Date!
        version: Int!
        cancelled: Boolean!
        effectiveDate: Date!
        externalId: String!
        monthlyPriceInCents: Int!
        onFreeTrial: Boolean!
        planName: String!
      }
    `;

    const parsed = await parseSchema(schema);

    const table = parsed.tables.find(
      ({tableName}) => tableName === 'TableSubscriptionEvent'
    );
    assert(table);
    expect(table.hasCdc).toBe(true);
    assert(table.hasCdc);
    expect(table.dispatcherConfig).toMatchInlineSnapshot(`
      {
        "memorySize": 384,
        "timeout": 90,
      }
    `);

    const model = parsed.models.find(
      ({typeName}) => typeName === 'SubscriptionEvent'
    );
    assert(model);
    expect(model.changeDataCaptureConfig).toHaveLength(1);
    expect(model.changeDataCaptureConfig).toMatchInlineSnapshot(`
      [
        {
          "dispatcherConfig": {
            "memorySize": 384,
            "timeout": 90,
          },
          "event": "UPSERT",
          "handlerConfig": {
            "memorySize": 256,
            "timeout": 30,
          },
          "handlerModuleId": "../src/enrich--subscription--upsert--account",
          "sourceModelName": "SubscriptionEvent",
          "targetModelName": "Account",
          "type": "ENRICHER",
          "writableTables": [
            "TableAccount",
          ],
        },
      ]
    `);

    expect(parsed).toMatchSnapshot();
  });
});
