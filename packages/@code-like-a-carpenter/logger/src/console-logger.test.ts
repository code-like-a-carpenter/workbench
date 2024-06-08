import {ConsoleLogger} from './console-logger.ts';

describe('ConsoleLogger', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, 'info').mockReturnValue(undefined);
  });

  afterEach(() => {
    spy.mockRestore();
  });

  describe('in development mode', () => {
    describe('#_log()', () => {
      it('logs strings', () => {
        const logger = new ConsoleLogger();
        logger._log('info', 'test');
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
          "{
            "message": "test",
            "level": "info"
          }"
        `);
      });

      it('logs strings and errors', () => {
        const logger = new ConsoleLogger();
        const e = new Error('something bad happened');
        e.stack = 'fake stack\nfake stack line 2';
        logger._log('info', 'test', {err: e});
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
          "{
            "message": "test",
            "stack": "fake stack\\nfake stack line 2",
            "level": "info"
          }"
        `);
      });
    });

    describe('#child()', () => {
      it('logs strings', () => {
        const logger = new ConsoleLogger();
        const childLogger = logger.child({requestId: '12345'});
        childLogger._log('info', 'test');
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
          "{
            "message": "test",
            "requestId": "12345",
            "level": "info"
          }"
        `);
      });

      it('logs strings and errors', () => {
        const logger = new ConsoleLogger();
        const childLogger = logger.child({requestId: '12345'});
        const e = new Error('something bad happened');
        e.stack = 'fake stack\nfake stack line 2';
        childLogger._log('info', 'test', {err: e});
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
          "{
            "message": "test",
            "stack": "fake stack\\nfake stack line 2",
            "requestId": "12345",
            "level": "info"
          }"
        `);
      });

      it('logs strings and objects', () => {
        const logger = new ConsoleLogger();
        const childLogger = logger.child({requestId: '12345'});
        childLogger._log('info', 'test', {proof: true});
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
          "{
            "message": "test",
            "requestId": "12345",
            "proof": true,
            "level": "info"
          }"
        `);
      });

      it('logs initial and additional metadata', () => {
        const logger = new ConsoleLogger();
        const childLogger = logger.child({requestId: '12345'});
        childLogger._log('info', 'a');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
          [
            "{
            "message": "a",
            "requestId": "12345",
            "level": "info"
          }",
          ]
        `);

        childLogger._log('info', 'a', {additional: true});
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.mock.calls[1]).toMatchInlineSnapshot(`
          [
            "{
            "message": "a",
            "requestId": "12345",
            "additional": true,
            "level": "info"
          }",
          ]
        `);

        const grandchildLogger = childLogger.child({moarMetadata: true});
        grandchildLogger._log('info', 'a', {additional: true});
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.mock.calls[2]).toMatchInlineSnapshot(`
          [
            "{
            "message": "a",
            "requestId": "12345",
            "moarMetadata": true,
            "additional": true,
            "level": "info"
          }",
          ]
        `);
      });
    });
  });

  describe('in production mode', () => {
    describe('#_log()', () => {
      it('does not log the authorization header', () => {
        const logger = new ConsoleLogger({dev: false});
        const headers: Record<string, string> = {authorization: 'abc'};
        logger.info('with request', {
          req: {
            connection: true,
            header(key: string): string {
              return headers[key];
            },
            headers,
          },
        });
        expect(spy).toHaveBeenCalled();
        expect(typeof spy.mock.calls[0][0]).toBe('string');
        expect(spy.mock.calls[0][0]).toMatch(/"authorization":\s*"<redacted>"/);
        expect(spy.mock.calls[0][0]).not.toMatch(/abc/);
      });

      it('redacts user PII', () => {
        const logger = new ConsoleLogger({dev: false});
        logger.info('with request', {
          user: {
            avatarUrl: 'https://example.com/avatar.png',
            displayName: 'Test User',
            email: 'test@example.com',
            externalId: '12345',
            login: 'test',
          },
        });
        expect(spy).toHaveBeenCalled();
        expect(JSON.parse(spy.mock.calls[0][0])).toMatchObject({
          level: 'info',
          message: 'with request',
          user: {
            avatarUrl: 'https://example.com/avatar.png',
            displayName: '<redacted>',
            email: '<redacted>',
            externalId: '12345',
            login: '<redacted>',
          },
        });
      });

      it('logs strings', () => {
        const logger = new ConsoleLogger({dev: false});
        const childLogger = logger.child({requestId: '12345'});
        childLogger.info('test');
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(
          `"{"requestId":"12345","level":"info","message":"test"}"`
        );
      });

      it('logs strings and objects', () => {
        const logger = new ConsoleLogger({dev: false});
        const childLogger = logger.child({requestId: '12345'});
        childLogger.info('test', {proof: true});
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(
          `"{"requestId":"12345","proof":true,"level":"info","message":"test"}"`
        );
      });

      it('logs original and additional metadata', () => {
        const logger = new ConsoleLogger({dev: false});
        const childLogger = logger.child({requestId: '12345'});
        childLogger.info('a');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
          [
            "{"requestId":"12345","level":"info","message":"a"}",
          ]
        `);

        childLogger.info('a', {additional: true});
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.mock.calls[1]).toMatchInlineSnapshot(`
          [
            "{"requestId":"12345","additional":true,"level":"info","message":"a"}",
          ]
        `);

        const grandchildLogger = childLogger.child({moarMetadata: true});
        grandchildLogger.info('a', {additional: true});
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.mock.calls[2]).toMatchInlineSnapshot(`
          [
            "{"requestId":"12345","moarMetadata":true,"additional":true,"level":"info","message":"a"}",
          ]
        `);
      });
    });
  });
});
