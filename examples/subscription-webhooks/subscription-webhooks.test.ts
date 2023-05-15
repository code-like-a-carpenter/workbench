import assert from 'assert';

import {DeleteCommand} from '@aws-sdk/lib-dynamodb';
import {faker} from '@faker-js/faker';

import {NotFoundError} from '@code-like-a-carpenter/foundation-runtime';
import {waitFor} from '@code-like-a-carpenter/wait-for';

import {ddbDocClient} from '../dependencies';

import type {SubscriptionEventPrimaryKey} from './__generated__/graphql';
import {
  createSubscriptionEvent,
  deleteAccount,
  deleteMetric,
  deletePlanMetric,
  queryAccount,
  queryMetric,
  queryPlanMetric,
  querySubscriptionEvent,
  readAccount,
  readMetric,
} from './__generated__/graphql';

export async function deleteSubscription(
  input: SubscriptionEventPrimaryKey
): Promise<void> {
  const tableName = process.env.TABLE_SUBSCRIPTION_EVENT;
  assert(tableName, 'TABLE_SUBSCRIPTION_EVENT is not set');

  await ddbDocClient.send(
    new DeleteCommand({
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      Key: {
        pk: `ACCOUNT#${input.externalId}`,
        sk: `SUBSCRIPTION_EVENT#${input.effectiveDate.toISOString()}`,
      },
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'NONE',
      TableName: tableName,
    })
  );
}

const matcher = {
  createdAt: expect.any(Date),
  id: expect.any(String),
  updatedAt: expect.any(Date),
};

const subscriptionMatcher = {
  ...matcher,
  effectiveDate: expect.any(Date),
};

describe('cdc', () => {
  it('triggers lambda function when records is inserted into a table', async () => {
    await cleanup();

    const externalId = String(faker.datatype.number());

    // Confirm there is no record yet.
    await expect(async () => await readAccount({externalId})).rejects.toThrow(
      NotFoundError
    );

    await expect(
      async () => await readMetric({onFreeTrial: true})
    ).rejects.toThrow(NotFoundError);

    await expect(
      async () => await readMetric({onFreeTrial: true})
    ).rejects.toThrow(NotFoundError);

    /**************************************************************************\
    | sign up on free trial
    \**************************************************************************/
    await createSubscriptionEvent({
      cancelled: false,
      effectiveDate: faker.date.past(3),
      externalId,
      monthlyPriceInCents: 1000,
      onFreeTrial: true,
      planName: 'ENTERPRISE',
    });

    // Block until all CDC has completed.
    let metrics = await waitFor(async () => {
      const {item: t} = await readMetric({onFreeTrial: true});
      expect(t.version).toBe(1);

      await expect(
        async () => await readMetric({onFreeTrial: false})
      ).rejects.toThrow(NotFoundError);

      return {t};
    }, 30000);

    let account = await waitFor(async () => {
      const {item} = await readAccount({externalId});
      expect(item).toBeDefined();
      expect(item.version).toBe(1);
      return item;
    }, 30000);
    expect(account).toMatchInlineSnapshot(
      subscriptionMatcher,
      `
      {
        "cancelled": false,
        "createdAt": Any<Date>,
        "effectiveDate": Any<Date>,
        "externalId": "8943",
        "hasEverSubscribed": true,
        "id": Any<String>,
        "indexedPlanName": "ENTERPRISE",
        "monthlyPriceInCents": 1000,
        "onFreeTrial": true,
        "planName": "ENTERPRISE",
        "updatedAt": Any<Date>,
        "version": 1,
      }
    `
    );

    expect(metrics).toMatchInlineSnapshot(
      {t: matcher},
      `
      {
        "t": {
          "count": 1,
          "createdAt": Any<Date>,
          "id": Any<String>,
          "monthlyRecurringRevenueInCents": 1000,
          "onFreeTrial": true,
          "updatedAt": Any<Date>,
          "version": 1,
        },
      }
    `
    );

    /**************************************************************************\
    | transition to paid
    \**************************************************************************/
    await createSubscriptionEvent({
      cancelled: false,
      effectiveDate: faker.date.future(0, account.effectiveDate),
      externalId,
      monthlyPriceInCents: 1000,
      onFreeTrial: false,
      planName: 'ENTERPRISE',
    });

    // Block until all CDC has completed.
    metrics = await waitFor(async () => {
      const {item: t} = await readMetric({onFreeTrial: true});
      expect(t.version).toBe(2);

      const {item: f} = await readMetric({onFreeTrial: false});
      expect(f.version).toBe(1);
      return {f, t};
    }, 30000);

    account = await waitFor(async () => {
      const {item} = await readAccount({externalId});
      expect(item).toBeDefined();
      expect(item.version).toBe(2);
      return item;
    }, 30000);
    expect(account).toMatchInlineSnapshot(
      subscriptionMatcher,
      `
      {
        "cancelled": false,
        "createdAt": Any<Date>,
        "effectiveDate": Any<Date>,
        "externalId": "8943",
        "hasEverSubscribed": true,
        "id": Any<String>,
        "indexedPlanName": "ENTERPRISE",
        "monthlyPriceInCents": 1000,
        "onFreeTrial": false,
        "planName": "ENTERPRISE",
        "updatedAt": Any<Date>,
        "version": 2,
      }
    `
    );

    expect(metrics).toMatchInlineSnapshot(
      {f: matcher, t: matcher},
      `
      {
        "f": {
          "count": 1,
          "createdAt": Any<Date>,
          "id": Any<String>,
          "monthlyRecurringRevenueInCents": 1000,
          "onFreeTrial": false,
          "updatedAt": Any<Date>,
          "version": 1,
        },
        "t": {
          "count": 1,
          "createdAt": Any<Date>,
          "id": Any<String>,
          "monthlyRecurringRevenueInCents": 1000,
          "onFreeTrial": true,
          "updatedAt": Any<Date>,
          "version": 2,
        },
      }
    `
    );

    /**************************************************************************\
    | downgrade to small team
    \**************************************************************************/
    await createSubscriptionEvent({
      cancelled: false,
      effectiveDate: faker.date.future(0, account.effectiveDate),
      externalId,
      monthlyPriceInCents: 500,
      onFreeTrial: false,
      planName: 'SMALL_TEAM',
    });

    // Block until all CDC has completed.
    metrics = await waitFor(async () => {
      const {item: t} = await readMetric({onFreeTrial: true});
      expect(t.version).toBe(2);

      const {item: f} = await readMetric({onFreeTrial: false});
      // version increments twice because we update the ENTERPRISE plan metric
      // and create a new SMALL_TEAM plan metric.
      expect(f.version).toBe(3);
      return {f, t};
    }, 30000);

    account = await waitFor(async () => {
      const {item} = await readAccount({externalId});
      expect(item).toBeDefined();
      expect(item.version).toBe(3);
      return item;
    }, 30000);
    expect(account).toMatchInlineSnapshot(
      subscriptionMatcher,
      `
      {
        "cancelled": false,
        "createdAt": Any<Date>,
        "effectiveDate": Any<Date>,
        "externalId": "8943",
        "hasEverSubscribed": true,
        "id": Any<String>,
        "indexedPlanName": "SMALL_TEAM",
        "monthlyPriceInCents": 500,
        "onFreeTrial": false,
        "planName": "SMALL_TEAM",
        "updatedAt": Any<Date>,
        "version": 3,
      }
    `
    );

    expect(metrics).toMatchInlineSnapshot(
      {f: matcher, t: matcher},
      `
      {
        "f": {
          "count": 1,
          "createdAt": Any<Date>,
          "id": Any<String>,
          "monthlyRecurringRevenueInCents": 500,
          "onFreeTrial": false,
          "updatedAt": Any<Date>,
          "version": 3,
        },
        "t": {
          "count": 1,
          "createdAt": Any<Date>,
          "id": Any<String>,
          "monthlyRecurringRevenueInCents": 1000,
          "onFreeTrial": true,
          "updatedAt": Any<Date>,
          "version": 2,
        },
      }
    `
    );

    /**************************************************************************\
    | cancel subscription
    \**************************************************************************/
    await createSubscriptionEvent({
      cancelled: true,
      effectiveDate: faker.date.future(0, account.effectiveDate),
      externalId,
      monthlyPriceInCents: 0,
      onFreeTrial: false,
      planName: null,
    });

    // Block until all CDC has completed.
    metrics = await waitFor(async () => {
      const {item: t} = await readMetric({onFreeTrial: true});
      expect(t.version).toBe(2);

      const {item: f} = await readMetric({onFreeTrial: false});
      expect(f.version).toBe(4);
      return {f, t};
    }, 30000);

    account = await waitFor(async () => {
      const {item} = await readAccount({externalId});
      expect(item).toBeDefined();
      expect(item.version).toBe(4);
      return item;
    }, 30000);
    expect(account).toMatchInlineSnapshot(
      subscriptionMatcher,
      `
      {
        "cancelled": true,
        "createdAt": Any<Date>,
        "effectiveDate": Any<Date>,
        "externalId": "8943",
        "hasEverSubscribed": true,
        "id": Any<String>,
        "indexedPlanName": "SMALL_TEAM",
        "lastPlanName": "SMALL_TEAM",
        "monthlyPriceInCents": 500,
        "onFreeTrial": false,
        "planName": null,
        "updatedAt": Any<Date>,
        "version": 4,
      }
    `
    );

    expect(metrics).toMatchInlineSnapshot(
      {f: matcher, t: matcher},
      `
      {
        "f": {
          "count": 1,
          "createdAt": Any<Date>,
          "id": Any<String>,
          "monthlyRecurringRevenueInCents": 500,
          "onFreeTrial": false,
          "updatedAt": Any<Date>,
          "version": 4,
        },
        "t": {
          "count": 1,
          "createdAt": Any<Date>,
          "id": Any<String>,
          "monthlyRecurringRevenueInCents": 1000,
          "onFreeTrial": true,
          "updatedAt": Any<Date>,
          "version": 2,
        },
      }
    `
    );

    await cleanup();
  }, 120000);
});

async function cleanup() {
  const promises = [];
  const {items: metrics} = await queryMetric({});
  for (const item of metrics) {
    promises.push(deleteMetric(item));
  }

  const {items: planMetrics} = await queryPlanMetric({});
  for (const item of planMetrics) {
    promises.push(deletePlanMetric(item));
  }

  const {items: accounts} = await queryAccount({
    hasEverSubscribed: true,
    index: 'gsi1',
  });
  for (const item of accounts) {
    promises.push(deleteAccount(item));

    const {items: subscriptions} = await querySubscriptionEvent({
      externalId: item.externalId,
    });
    for (const sub of subscriptions) {
      promises.push(deleteSubscription(sub));
    }
  }

  const results = await Promise.allSettled(promises);
  results
    .filter(({status}) => status === 'rejected')
    .forEach((result) => {
      assert(result.status === 'rejected');
      throw result.reason;
    });
}
