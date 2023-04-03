import {resolveActionsModule} from './paths';

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
