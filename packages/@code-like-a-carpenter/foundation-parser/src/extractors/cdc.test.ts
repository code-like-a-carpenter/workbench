import assert from 'node:assert';

import {parseSchema} from '../test-helpers';

describe('@reacts', () => {
  it('configures an event handler for the model', async () => {
    const schema = /* GraphQL */ `
      """
      A summary of all the accounts on a particular plan.
      """
      type PlanMetric implements Model & Timestamped & Versioned
        @model
        # This is a little weird looking, but it's basically a way to allow scans
        # without generally building it in as a feature. This strategy should only be
        # in very small tables where it won't matter that every record is in a single
        # partition. In this case, we're talking about all the plans a startup might
        # offer times 2 for each boolean (cancelled and onFreeTrial), so it's probably
        # less than 20 records. If you find yourself with many more records, you
        # should look at using something other than DynamoDB for aggregating this
        # data.
        @primaryKey(
          pkFields: []
          pkPrefix: "BUSINESS_METRIC"
          skFields: ["onFreeTrial", "planName"]
          skPrefix: "PLAN"
        )
        @reacts(
          event: UPSERT
          handlerImportName: "PlanMetricReactor"
          handlerPath: "../src/react--plan-metric--upsert"
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
        "batchSize": 10,
        "dependenciesModuleId": "../dependencies",
        "directory": "placeholder/dispatcher-table-plan-metric",
        "filename": "dispatcher-table-plan-metric",
        "functionName": "TablePlanMetricCDCDispatcher",
        "maximumRetryAttempts": 3,
        "memorySize": 256,
        "runtimeModuleId": "@code-like-a-carpenter/foundation-runtime",
        "timeout": 30,
      }
    `);

    const [model] = parsed.models;
    assert(model);
    expect(model.changeDataCaptureConfig).toHaveLength(1);
    expect(model.changeDataCaptureConfig).toMatchInlineSnapshot(`
      [
        {
          "event": "UPSERT",
          "sourceModelName": "PlanMetric",
          "type": "TRIGGER",
        },
      ]
    `);

    expect(parsed).toMatchSnapshot();
  });
});

describe('@triggers', () => {
  it('configures the handler to update one model when another changes', async () => {
    const schema = /* GraphQL */ `
      """
      A customer account.
      """
      type BaseAccount implements Model & Versioned & Timestamped
        @model
        @primaryKey(
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
          event: UPSERT
          handlerImportName: "SubscriptionEventUpsertAccountEnricher"
          handlerPath: "../src/enrich--subscription--upsert--account"
          targetModel: "Account"
        )
        @ledger
        @model
        @primaryKey(
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
        "batchSize": 10,
        "dependenciesModuleId": "../dependencies",
        "directory": "placeholder/dispatcher-table-subscription-event",
        "filename": "dispatcher-table-subscription-event",
        "functionName": "TableSubscriptionEventCDCDispatcher",
        "maximumRetryAttempts": 3,
        "memorySize": 256,
        "runtimeModuleId": "@code-like-a-carpenter/foundation-runtime",
        "timeout": 30,
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
          "event": "UPSERT",
          "sourceModelName": "SubscriptionEvent",
          "targetModelName": "Account",
          "type": "ENRICHER",
        },
      ]
    `);

    expect(parsed).toMatchSnapshot();
  });
});
