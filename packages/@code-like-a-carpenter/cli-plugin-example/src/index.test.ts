import {execSync} from 'node:child_process';

describe('cli-plugin-example', () => {
  it('works', async () => {
    const result = execSync('npx @code-like-a-carpenter/cli example');
    expect(result.toString()).toMatch('it works');
  });
});
