import {Exception} from '@code-like-a-carpenter/exception';

import {ClientError, HttpException, NotFound} from './http-errors';

describe('ClientError', () => {
  it('is an instanceof Exception', () => {
    const exception = new ClientError('message');
    expect(exception).toBeInstanceOf(Exception);
  });

  it('is an instance of HttpException', () => {
    const exception = new ClientError('message');
    expect(exception).toBeInstanceOf(HttpException);
  });

  it('renders the proper name', () => {
    const exception = new ClientError('message');
    expect(exception.name).toEqual('ClientError');
    expect(exception.toString()).toMatchInlineSnapshot(
      `"ClientError: message"`
    );
    expect(`${exception}`).toMatchInlineSnapshot(`"ClientError: message"`);
  });
});

describe('NotFound', () => {
  it('is an instanceof Exception', () => {
    const exception = new NotFound('message');
    expect(exception).toBeInstanceOf(Exception);
  });

  it('is an instance of HttpException', () => {
    const exception = new NotFound('message');
    expect(exception).toBeInstanceOf(HttpException);
  });

  it('renders the proper name', () => {
    const exception = new NotFound('message');
    expect(exception.name).toEqual('NotFound');
    expect(exception.toString()).toMatchInlineSnapshot(`"NotFound: message"`);
    expect(`${exception}`).toMatchInlineSnapshot(`"NotFound: message"`);
  });

  it('does not require a message', () => {
    const exception = new NotFound();
    expect(exception.toString()).toMatchInlineSnapshot(`"NotFound"`);
    expect(`${exception}`).toMatchInlineSnapshot(`"NotFound"`);

    const exception2 = new NotFound({telemetry: {proof: true}});
    expect(exception2.toString()).toMatchInlineSnapshot(`"NotFound"`);
    expect(`${exception2}`).toMatchInlineSnapshot(`"NotFound"`);
    expect(exception2.telemetry).toMatchInlineSnapshot(`
      {
        "proof": true,
      }
    `);
  });
});
