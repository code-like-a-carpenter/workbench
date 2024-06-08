import {ServiceException} from '@aws-sdk/smithy-client';

import {AlreadyExistsError} from './already-exists-error.ts';
import {NotFoundError} from './not-found-error.ts';
import {OptimisticLockingError} from './optimistic-locking-error.ts';
import {UnexpectedAwsError} from './unexpected-aws-error.ts';
import {UnexpectedError} from './unexpected-error.ts';

describe('AlreadyExistsError', () => {
  it('stringifies', () => {
    const err = new AlreadyExistsError('User', {id: '123'});
    expect(err).toMatchInlineSnapshot(
      `[AlreadyExistsError: User with specified primaryKey already exists. Please switch to updateUser instead of createUser.]`
    );
    expect(err.cause).toMatchInlineSnapshot(`undefined`);
    expect(err.primaryKey).toMatchInlineSnapshot(`
      {
        "id": "123",
      }
    `);
    expect(err.typeName).toMatchInlineSnapshot(`"User"`);
    expect(JSON.stringify(err)).toMatchInlineSnapshot(
      `"{"telemetry":{"primaryKey":{"id":"123"},"typename":"User"},"primaryKey":{"id":"123"},"typeName":"User"}"`
    );
  });
});

describe('NotFoundError', () => {
  it('stringifies', () => {
    const err = new NotFoundError('User', {id: '123'});
    expect(err).toMatchInlineSnapshot(
      `[NotFoundError: No User found with specified primaryKey]`
    );
    expect(err.cause).toMatchInlineSnapshot(`undefined`);
    expect(err.primaryKey).toMatchInlineSnapshot(`
      {
        "id": "123",
      }
    `);
    expect(err.typeName).toMatchInlineSnapshot(`"User"`);
    expect(JSON.stringify(err)).toMatchInlineSnapshot(
      `"{"telemetry":{"primaryKey":{"id":"123"},"typename":"User"},"primaryKey":{"id":"123"},"typeName":"User"}"`
    );
  });
});

describe('OptimisticLockingError', () => {
  it('stringifies', () => {
    const err = new OptimisticLockingError('User', {id: '123'});
    expect(err).toMatchInlineSnapshot(
      `[OptimisticLockingError: User with specified primaryKey is out of date. Please refresh and try again.]`
    );
    expect(err.cause).toMatchInlineSnapshot(`undefined`);
    expect(err.primaryKey).toMatchInlineSnapshot(`
      {
        "id": "123",
      }
    `);
    expect(err.typeName).toMatchInlineSnapshot(`"User"`);
    expect(JSON.stringify(err)).toMatchInlineSnapshot(
      `"{"telemetry":{"primaryKey":{"id":"123"},"typename":"User"},"primaryKey":{"id":"123"},"typeName":"User"}"`
    );
  });
});

describe('UnexpectedAwsError', () => {
  it('stringifies', () => {
    const err = new UnexpectedAwsError(
      new ServiceException({
        $fault: 'client',
        $metadata: {
          requestId: '123',
        },
        $retryable: {
          throttling: true,
        },
        $service: 'fake',
        message: 'Something bad happened',
        name: 'FakeAwsError',
      })
    );
    expect(err).toMatchInlineSnapshot(
      `[UnexpectedAwsError: The AWS SDK threw an unexpected error]`
    );
    expect(err.cause).toMatchInlineSnapshot(
      `[FakeAwsError: Something bad happened]`
    );
    expect(JSON.stringify(err)).toMatchInlineSnapshot(`"{"telemetry":{}}"`);
  });
});

describe('UnexpectedError', () => {
  it('stringifies', () => {
    const err = new UnexpectedError(new Error('Something bad happened'));
    expect(err).toMatchInlineSnapshot(
      `[UnexpectedError: An unexpected error occurred]`
    );
    expect(err.cause).toMatchInlineSnapshot(`[Error: Something bad happened]`);
    expect(JSON.stringify(err)).toMatchInlineSnapshot(`"{"telemetry":{}}"`);
  });
});
