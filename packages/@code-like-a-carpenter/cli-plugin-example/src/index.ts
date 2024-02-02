import {definePlugin} from '@code-like-a-carpenter/cli-core';

export default definePlugin((yargs) => {
  yargs.command({
    command: 'example',
    handler() {
      console.log('it works');
    },
  });
});
