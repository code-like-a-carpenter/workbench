import {Exception} from './exception';

describe('Exception', () => {
  it('is an instance of Error', () => {
    const exception = new Exception('message');
    expect(exception).toBeInstanceOf(Error);
  });

  it('has a name property', () => {
    const exception = new Exception('message');
    expect(exception.name).toEqual('Exception');
  });

  it('renders the proper name when subclassed', () => {
    class Subclass extends Exception<object> {}
    const exception = new Subclass('message');
    expect(exception.name).toEqual('Subclass');
    expect(exception.toString()).toMatchInlineSnapshot(`"Subclass: message"`);
    expect(`${exception}`).toMatchInlineSnapshot(`"Subclass: message"`);
  });

  it('renders the proper name in a deep hierarchy', () => {
    class Subclass extends Exception<object> {}
    class SubSubclass extends Subclass {}
    const exception = new SubSubclass('message');
    expect(exception.name).toEqual('SubSubclass');
    expect(exception.toString()).toMatchInlineSnapshot(
      `"SubSubclass: message"`
    );
    expect(`${exception}`).toMatchInlineSnapshot(`"SubSubclass: message"`);
  });
});
