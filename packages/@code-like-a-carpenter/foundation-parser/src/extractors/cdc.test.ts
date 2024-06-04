import assert from 'node:assert';

import {parseSchema} from '../test-helpers.ts';

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
        @reacts(
          event: UPSERT
          importName: "Placeholder"
          importPath: "../src/react--plan-metric--upsert"
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
        "nestedStackLocation": "./dispatcher.yml",
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
          "actionsModuleId": "../actions",
          "directory": "placeholder/react--plan-metric--upsert",
          "event": "UPSERT",
          "filename": "react--plan-metric--upsert",
          "functionName": "FnReactPMUpsert2b2e8d7d",
          "handlerImportName": "Placeholder",
          "handlerModuleId": "../../../src/react--plan-metric--upsert",
          "memorySize": 256,
          "nestedStackLocation": "./cdc.yml",
          "readableTables": [],
          "runtimeModuleId": "@code-like-a-carpenter/foundation-runtime",
          "sourceModelName": "PlanMetric",
          "timeout": 30,
          "type": "REACTOR",
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
          event: UPSERT
          importName: "Placeholder"
          importPath: "../src/enrich--subscription--upsert--account"
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
        "batchSize": 10,
        "dependenciesModuleId": "../dependencies",
        "directory": "placeholder/dispatcher-table-subscription-event",
        "filename": "dispatcher-table-subscription-event",
        "functionName": "TableSubscriptionEventCDCDispatcher",
        "maximumRetryAttempts": 3,
        "memorySize": 256,
        "nestedStackLocation": "./dispatcher.yml",
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
          "actionsModuleId": "../actions",
          "directory": "placeholder/enricher--subscription-event--upsert--account",
          "event": "UPSERT",
          "filename": "enricher--subscription-event--upsert--account",
          "functionName": "FnEnricherSEUpsertA5b59364d",
          "handlerImportName": "Placeholder",
          "handlerModuleId": "../../../src/enrich--subscription--upsert--account",
          "memorySize": 256,
          "nestedStackLocation": "./cdc.yml",
          "readableTables": [],
          "runtimeModuleId": "@code-like-a-carpenter/foundation-runtime",
          "sourceModelName": "SubscriptionEvent",
          "targetModelName": "Account",
          "timeout": 30,
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
