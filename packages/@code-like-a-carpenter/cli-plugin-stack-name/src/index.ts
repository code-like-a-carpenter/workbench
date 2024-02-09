import {definePlugin} from '@code-like-a-carpenter/cli-core';
import {getStackName} from '@code-like-a-carpenter/tooling-common';

export default definePlugin((yargs) => {
  yargs.command({
    builder: (y) =>
      y.positional('projectName', {
        demandOption: true,
        type: 'string',
      }),
    command: 'stack-name <projectName>',
    async handler(argv) {
      console.log(getStackName(argv.projectName));
    },
  });
});
