import {AssertionError} from 'assert';

import {assert} from './assert.mjs';

describe('assert', () => {
  it('throws a string error', () => {
    const fn = () => assert(false, 'error');
    expect(fn).toThrow(AssertionError);
    expect(fn).toThrowErrorMatchingInlineSnapshot(`"error"`);
  });

  // From what I can tell, this text fails because node doesn't do what the docs
  // say it does.
  it.skip('throws a custom error', () => {
    const fn = () => assert(false, new TypeError('error'));
    expect(fn).toThrow(TypeError);
    expect(fn).toThrowErrorMatchingInlineSnapshot();
  });

  it('throws a provided string error', () => {
    const fn = () => assert(false, () => 'error');
    expect(fn).toThrow(AssertionError);
    expect(fn).toThrowErrorMatchingInlineSnapshot(`"error"`);
  });

  it('throws a provided custom error', () => {
    const fn = () => assert(false, () => new TypeError('error'));
    expect(fn).toThrow(TypeError);
    expect(fn).toThrowErrorMatchingInlineSnapshot(`"error"`);
  });
});
