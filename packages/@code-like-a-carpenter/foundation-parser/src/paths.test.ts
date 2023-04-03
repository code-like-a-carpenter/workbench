import {increasePathDepth, resolveActionsModule} from './paths';

describe('increasePathDepth()', () => {
  it('increases the directory depth for a relative path', () => {
    expect(increasePathDepth('./foo')).toEqual('../foo');
  });

  it('does not change the path for an absolute path', () => {
    expect(increasePathDepth('/foo')).toEqual('/foo');
  });

  it('does not change the path for a node_module', () => {
    expect(increasePathDepth('foo')).toEqual('foo');
  });
});

describe('resolveActionsModule()', () => {
  it('resolves the path from the handler to the relative actions module', () => {
    expect(
      resolveActionsModule('./cloudformation/handler/index.ts', './graphql')
    ).toBe('../../../graphql');
  });

  it('resolves the path from the handler to the absolute actions module', () => {
    expect(
      resolveActionsModule('./cloudformation/handler/index.ts', 'actions')
    ).toBe('actions');
  });
});
