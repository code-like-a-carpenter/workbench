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

describe('@enriches', () => {
  it(
    'applies a custom mapper to update one model based on another',
    async () => {
      const externalId = String(faker.datatype.number());

      // Confirm there is no record yet.
      await expect(async () => await readAccount({externalId})).rejects.toThrow(
        NotFoundError
      );

      const {item: subscription1} = await createSubscriptionEvent({
        cancelled: false,
        effectiveDate: faker.date.past(3),
        externalId,
        monthlyPriceInCents: 1000,
        onFreeTrial: true,
        planName: 'ENTERPRISE',
      });

      let account = await waitFor(async () => {
        const {item} = await readAccount({externalId});
        expect(item).toBeDefined();
        expect(item.version).toBe(1);
        return item;
      }, 30000);
      expect(account.planName).toBe('ENTERPRISE');
      expect(account.onFreeTrial).toBe(true);
      expect(account.cancelled).not.toBe(true);

      const {item: subscription2} = await createSubscriptionEvent({
        cancelled: false,
        effectiveDate: faker.date.future(0, account.effectiveDate),
        externalId,
        monthlyPriceInCents: 1000,
        onFreeTrial: false,
        planName: 'ENTERPRISE',
      });

      // eslint-disable-next-line require-atomic-updates
      account = await waitFor(async () => {
        const {item} = await readAccount({externalId});
        expect(item).toBeDefined();
        expect(item.version).toBe(2);
        return item;
      }, 30000);
      expect(account.planName).toBe('ENTERPRISE');
      expect(account.onFreeTrial).toBe(false);
      expect(account.cancelled).not.toBe(true);

      const {item: subscription3} = await createSubscriptionEvent({
        cancelled: false,
        effectiveDate: faker.date.future(0, account.effectiveDate),
        externalId,
        monthlyPriceInCents: 500,
        onFreeTrial: false,
        planName: 'SMALL_TEAM',
      });

      // eslint-disable-next-line require-atomic-updates
      account = await waitFor(async () => {
        const {item} = await readAccount({externalId});
        expect(item).toBeDefined();
        expect(item.version).toBe(3);
        return item;
      }, 30000);
      expect(account.planName).toBe('SMALL_TEAM');
      expect(account.onFreeTrial).toBe(false);
      expect(account.cancelled).not.toBe(true);

      const {item: subscription4} = await createSubscriptionEvent({
        cancelled: true,
        effectiveDate: faker.date.future(0, account.effectiveDate),
        externalId,
        monthlyPriceInCents: 0,
        onFreeTrial: false,
        planName: null,
      });

      // eslint-disable-next-line require-atomic-updates
      account = await waitFor(async () => {
        const {item} = await readAccount({externalId});
        expect(item).toBeDefined();
        expect(item.version).toBe(4);
        return item;
      }, 30000);
      expect(account.planName).toBe(null);
      expect(account.onFreeTrial).toBe(false);
      expect(account.cancelled).toBe(true);

      // Block cleanup until all CDC has completed.
      await waitFor(async () => {
        const {item: t} = await readMetric({onFreeTrial: true});
        expect(t.version).toBe(8);

        const {item: f} = await readMetric({onFreeTrial: false});
        expect(f.version).toBe(8);
      }, 30000);

      const promises = [
        waitFor(() => deleteMetric({onFreeTrial: false})),
        waitFor(() => deleteMetric({onFreeTrial: true})),
        waitFor(() =>
          deletePlanMetric({onFreeTrial: false, planName: 'ENTERPRISE'})
        ),
        waitFor(() =>
          deletePlanMetric({onFreeTrial: false, planName: 'SMALL_TEAM'})
        ),
        waitFor(() =>
          deletePlanMetric({onFreeTrial: true, planName: 'ENTERPRISE'})
        ),
        waitFor(() =>
          deletePlanMetric({onFreeTrial: true, planName: 'SMALL_TEAM'})
        ),
        waitFor(() => deleteAccount(account)),
        waitFor(() => deleteSubscription(subscription1)),
        waitFor(() => deleteSubscription(subscription2)),
        waitFor(() => deleteSubscription(subscription3)),
        waitFor(() => deleteSubscription(subscription4)),
      ];
      const results = await Promise.allSettled(promises);
      results
        .filter(({status}) => status === 'rejected')
        .forEach((result) => {
          assert(result.status === 'rejected');
          throw result.reason;
        });
    },
    5 * 60 * 1000
  );
});

describe('@reacts', () => {
  it('triggers a lambda function when a record is inserted into a table', async () => {
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

    const {item: subscription} = await createSubscriptionEvent({
      cancelled: false,
      effectiveDate: faker.date.past(3),
      externalId,
      monthlyPriceInCents: 1000,
      onFreeTrial: true,
      planName: 'ENTERPRISE',
    });

    // This should be at version 2 because a Metric is blind-written for each
    // PlanMetric write. 2 PlanMetrics are written, one for each of
    // onFreeTrial = true and onFreeTrial = false. In other words, all Metrics
    // are overwritten each time any PlanMetric is written.
    const metric = await waitFor(async () => {
      const {item} = await readMetric({onFreeTrial: true});
      expect(item).toBeDefined();
      expect(item.version).toBe(2);
      return item;
    }, 60000);

    expect(metric).toMatchInlineSnapshot(
      {
        createdAt: expect.any(Date),
        id: expect.any(String),
        updatedAt: expect.any(Date),
      },
      `
      {
        "count": 1,
        "createdAt": Any<Date>,
        "id": Any<String>,
        "monthlyRecurringRevenueInCents": 1000,
        "onFreeTrial": true,
        "updatedAt": Any<Date>,
        "version": 2,
      }
    `
    );
    const account = await waitFor(async () => {
      const {item} = await readAccount({externalId});
      expect(item).toBeDefined();
      expect(item.version).toBe(1);
      return item;
    }, 30000);

    const promises = [
      waitFor(() => deleteMetric({onFreeTrial: false})),
      waitFor(() => deleteMetric({onFreeTrial: true})),
      waitFor(() =>
        deletePlanMetric({onFreeTrial: false, planName: 'ENTERPRISE'})
      ),
      waitFor(() =>
        deletePlanMetric({onFreeTrial: true, planName: 'ENTERPRISE'})
      ),
      waitFor(() => deleteAccount(account)),
      waitFor(() => deleteSubscription(subscription)),
    ];
    const results = await Promise.allSettled(promises);
    results
      .filter(({status}) => status === 'rejected')
      .forEach((result) => {
        assert(result.status === 'rejected');
        throw result.reason;
      });
  }, 120000);
});
