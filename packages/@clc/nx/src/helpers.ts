import {writeFile} from 'node:fs/promises';

import prettier from 'prettier';

export async function writePrettierFile(filename: string, content: string) {
  const config = await prettier.resolveConfig(filename);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: filename,
  });
  await writeFile(filename, formatted);
}
