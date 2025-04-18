import assert from 'assert';

import {load} from '@clc/test-helpers';
import {faker} from '@faker-js/faker';
import Base64Import from 'base64url';

import {
  NotFoundError,
  OptimisticLockingError,
} from '@code-like-a-carpenter/foundation-runtime';

import {
  blindWriteUserSession,
  createUserSession,
  deleteUserSession,
  readUserSession,
  updateUserSession,
} from './__generated__/graphql.ts';

const Base64 = Base64Import.default ?? Base64Import;

const userSessionMatcher = {
  createdAt: expect.any(Date),
  expires: expect.any(Date),
  updatedAt: expect.any(Date),
};

const itemMatcher = {
  capacity: {TableName: expect.any(String)},
  item: userSessionMatcher,
};

describe('createUserSession()', () => {
  it('creates a record', async () => {
    const result = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(result).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "foo",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 1,
        },
        "metrics": undefined,
      }
    `
    );

    expect(Base64.decode(result.item.id)).toMatchInlineSnapshot(
      `"UserSession:USER_SESSION#181c887c-e7df-4331-89fb-a65d255867e2"`
    );

    expect(result.item.createdAt.getTime()).not.toBeNaN();
    expect(result.item.expires.getTime()).not.toBeNaN();
    expect(result.item.updatedAt.getTime()).not.toBeNaN();

    const tableName = process.env.TABLE_USER_SESSION;
    assert(tableName, 'TABLE_USER_SESSION is not set');

    const raw = await load({
      pk: `USER_SESSION#${result.item.sessionId}`,
      tableName,
    });

    expect(raw.Item?.ttl * 1000).toBeCloseTo(result.item.expires.getTime(), -4);

    // cleanup, not part of test
    await deleteUserSession(result.item);
  });

  it('creates a record with a custom expiration Date', async () => {
    const expires = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const result = await createUserSession({
      expires,
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(result.item.expires.getTime()).not.toBeNaN();

    expect(result.item.expires.getTime()).toBeCloseTo(expires.getTime(), -4);

    // cleanup, not part of test
    await deleteUserSession(result.item);
  });

  it('creates a record with a custom expiration Date that is undefined', async () => {
    const expires = undefined;

    const result = await createUserSession({
      expires,
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(result.item.expires.getTime()).not.toBeNaN();

    // cleanup, not part of test
    await deleteUserSession(result.item);
  });
});

describe('blindWriteUserSession()', () => {
  it('creates a user session if it does not exist', async () => {
    const result = await blindWriteUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    try {
      expect(result).toMatchInlineSnapshot(
        itemMatcher,
        `
        {
          "capacity": {
            "CapacityUnits": 1,
            "Table": {
              "CapacityUnits": 1,
            },
            "TableName": Any<String>,
          },
          "item": {
            "createdAt": Any<Date>,
            "expires": Any<Date>,
            "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
            "session": {
              "foo": "foo",
            },
            "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
            "updatedAt": Any<Date>,
            "version": 1,
          },
          "metrics": undefined,
        }
      `
      );

      expect(Base64.decode(result.item.id)).toMatchInlineSnapshot(
        `"UserSession:USER_SESSION#181c887c-e7df-4331-89fb-a65d255867e2"`
      );

      expect(result.item.createdAt.getTime()).not.toBeNaN();
      expect(result.item.expires.getTime()).not.toBeNaN();
      expect(result.item.updatedAt.getTime()).not.toBeNaN();
      expect(result.item.version).toBe(1);
    } finally {
      // cleanup, not part of test
      await deleteUserSession(result.item);
    }
  });

  it('creates a user session with a custom expiration date if it does not exist', async () => {
    const expires = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const result = await blindWriteUserSession({
      expires,
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(result.item.expires.getTime()).not.toBeNaN();

    expect(result.item.expires.getTime()).toBeCloseTo(expires.getTime(), -4);

    expect(result.item.version).toBe(1);

    // cleanup, not part of test
    await deleteUserSession(result.item);
  });

  it('creates a user session with a custom expiration date that is undefined if it does not exist', async () => {
    const expires = undefined;

    const result = await blindWriteUserSession({
      expires,
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(result.item.expires.getTime()).not.toBeNaN();

    expect(result.item.version).toBe(1);

    // cleanup, not part of test
    await deleteUserSession(result.item);
  });

  it('overwrites an existing record', async () => {
    const createResult = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });
    expect(createResult).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "foo",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 1,
        },
        "metrics": undefined,
      }
    `
    );
    expect(createResult.item.session).toEqual({foo: 'foo'});
    expect(createResult.item.version).toBe(1);

    const item = {...createResult.item};
    // @ts-expect-error
    delete item.version;
    const updateResult = await blindWriteUserSession({
      ...item,
      session: {foo: 'bar'},
    });
    expect(updateResult).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "bar",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 2,
        },
        "metrics": undefined,
      }
    `
    );
    expect(updateResult.item.session).toEqual({foo: 'bar'});
    expect(updateResult.item.version).toBe(2);

    const readResult = await readUserSession(createResult.item);
    expect(readResult).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "bar",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 2,
        },
        "metrics": undefined,
      }
    `
    );
    expect(updateResult.item.session).toEqual({foo: 'bar'});

    expect(readResult.item.createdAt).toEqual(updateResult.item.createdAt);
    expect(readResult.item.updatedAt).toEqual(updateResult.item.updatedAt);

    // cleanup, not part of test
    await deleteUserSession(createResult.item);
  });

  it('overwrites an existing record with a custom expiration Date', async () => {
    const expires = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const createResult = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(createResult.item.expires).not.toBe(expires);
    expect(createResult.item.version).toBe(1);

    const updateResult = await blindWriteUserSession({
      ...createResult.item,
      expires,
      session: {foo: 'bar'},
    });

    expect(updateResult.item.expires.getTime()).toBeCloseTo(
      expires.getTime(),
      -4
    );
    expect(updateResult.item.version).toBe(2);

    const readResult = await readUserSession(createResult.item);
    expect(readResult.item.expires.getTime()).toBeCloseTo(
      expires.getTime(),
      -4
    );

    // cleanup, not part of test
    await deleteUserSession(createResult.item);
  });

  it('overwrites an existing record with a custom expiration Date that does not exist', async () => {
    const expires = undefined;

    const createResult = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(createResult.item.expires).not.toBe(expires);
    expect(createResult.item.version).toBe(1);

    const updateResult = await blindWriteUserSession({
      ...createResult.item,
      expires,
      session: {foo: 'bar'},
    });

    expect(updateResult.item.version).toBe(2);

    await readUserSession(createResult.item);

    // cleanup, not part of test
    await deleteUserSession(createResult.item);
  });
});

describe('deleteUserSession()', () => {
  it('deletes a record', async () => {
    const result = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    const deleteResult = await deleteUserSession(result.item);
    expect(deleteResult).toMatchInlineSnapshot(
      {capacity: {TableName: expect.any(String)}},
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": undefined,
        "metrics": undefined,
      }
    `
    );

    await expect(
      async () => await readUserSession(result.item)
    ).rejects.toThrow(NotFoundError);
  });

  it('throws an error if the record does not exist', async () => {
    await expect(
      async () => await deleteUserSession({sessionId: 'some-id'})
    ).rejects.toThrow(NotFoundError);
  });
});

describe('readUserSession()', () => {
  it('reads a record', async () => {
    const result = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    const readResult = await readUserSession(result.item);
    expect(readResult).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "foo",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 1,
        },
        "metrics": undefined,
      }
    `
    );

    // cleanup, not part of test
    await deleteUserSession(result.item);
  });

  it('throws an error if the record does not exist', async () => {
    await expect(
      async () => await readUserSession({sessionId: 'some-id'})
    ).rejects.toThrow(NotFoundError);
  });
});

describe('updateUserSession()', () => {
  it('updates a record', async () => {
    const createResult = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });
    expect(createResult).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "foo",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 1,
        },
        "metrics": undefined,
      }
    `
    );
    expect(createResult.item.session).toEqual({foo: 'foo'});

    const updateResult = await updateUserSession({
      ...createResult.item,
      session: {foo: 'bar'},
    });
    expect(updateResult).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "bar",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 2,
        },
        "metrics": undefined,
      }
    `
    );
    expect(updateResult.item.session).toEqual({foo: 'bar'});

    const readResult = await readUserSession(createResult.item);
    expect(readResult).toMatchInlineSnapshot(
      itemMatcher,
      `
      {
        "capacity": {
          "CapacityUnits": 1,
          "Table": {
            "CapacityUnits": 1,
          },
          "TableName": Any<String>,
        },
        "item": {
          "createdAt": Any<Date>,
          "expires": Any<Date>,
          "id": "VXNlclNlc3Npb246VVNFUl9TRVNTSU9OIzE4MWM4ODdjLWU3ZGYtNDMzMS04OWZiLWE2NWQyNTU4NjdlMg",
          "session": {
            "foo": "bar",
          },
          "sessionId": "181c887c-e7df-4331-89fb-a65d255867e2",
          "updatedAt": Any<Date>,
          "version": 2,
        },
        "metrics": undefined,
      }
    `
    );
    expect(updateResult.item.session).toEqual({foo: 'bar'});

    expect(readResult.item.createdAt).toEqual(updateResult.item.createdAt);
    expect(readResult.item.updatedAt).toEqual(updateResult.item.updatedAt);

    // cleanup, not part of test
    await deleteUserSession(createResult.item);
  });

  it('updates a record with a custom expiration Date', async () => {
    const expires = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const createResult = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    expect(createResult.item.expires).not.toBe(expires);

    const updateResult = await updateUserSession({
      ...createResult.item,
      expires,
      session: {foo: 'bar'},
    });

    expect(updateResult.item.expires.getTime()).toBeCloseTo(
      expires.getTime(),
      -4
    );

    const readResult = await readUserSession(createResult.item);
    expect(readResult.item.expires.getTime()).toBeCloseTo(
      expires.getTime(),
      -4
    );

    // cleanup, not part of test
    await deleteUserSession(createResult.item);
  });

  it('updates a record with a custom expiration Date that does not exist', async () => {
    const expires = undefined;

    const createResult = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });

    await updateUserSession({
      ...createResult.item,
      expires,
      session: {foo: 'bar'},
    });

    await readUserSession(createResult.item);

    // cleanup, not part of test
    await deleteUserSession(createResult.item);
  });

  it('throws an error if the record does not exist', async () => {
    await expect(
      async () =>
        await updateUserSession({
          session: {foo: 'foo'},
          sessionId: 'some-id',
          version: 0,
        })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws an error if the loaded record is out of date', async () => {
    const createResult = await createUserSession({
      session: {foo: 'foo'},
      sessionId: faker.string.uuid(),
    });
    await updateUserSession({
      ...createResult.item,
      session: {foo: 'bar'},
    });

    await expect(
      async () =>
        await updateUserSession({
          ...createResult.item,
          session: {foo: 'bar'},
        })
    ).rejects.toThrow(OptimisticLockingError);

    // cleanup, not part of test
    await deleteUserSession(createResult.item);
  });
});
