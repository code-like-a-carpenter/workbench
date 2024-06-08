import './config.ts';

import {definePlugin} from '@code-like-a-carpenter/cli-core';
import {load} from '@code-like-a-carpenter/workbench-config';

export default definePlugin((yargs) => {
  yargs.command({
    command: 'example',
    async handler(argv) {
      const config = await load(argv);
      console.log('it works', {config});
    },
  });
});
