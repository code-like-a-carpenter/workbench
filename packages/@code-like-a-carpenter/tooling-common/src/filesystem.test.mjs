import {
  chmod,
  mkdtemp,
  open,
  readdir,
  readFile,
  rm,
  stat,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

import {writePrettierFile} from './filesystem.mjs';

describe('writePrettierFile()', () => {
  /** @type {string} */
  let dir;
  /** @type {string} */
  let filename;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'write-prettier-file-'));
    filename = path.join(dir, 'tsconfig.json');
  });

  afterEach(async () => {
    await rm(dir, {force: true, recursive: true});
  });

  it('formats the content it writes', async () => {
    await writePrettierFile(filename, '{"a":1,"b":[2]}');

    const text = await readFile(filename, 'utf-8');
    expect(JSON.parse(text)).toEqual({a: 1, b: [2]});
    expect(text).not.toBe('{"a":1,"b":[2]}');
    expect(text.endsWith('\n')).toBe(true);
  });

  it('keeps the mode of the file it replaces', async () => {
    await writePrettierFile(filename, '{"a":1}');
    await chmod(filename, 0o640);

    await writePrettierFile(filename, '{"a":2}');

    expect((await stat(filename)).mode & 0o777).toBe(0o640);
  });

  it('replaces the file rather than rewriting it in place', async () => {
    await writePrettierFile(filename, '{"generation":1}');

    // Whoever already opened the file goes on reading the version they opened.
    // Rewriting in place would show them the new content — or, mid-write, a
    // mixture of both, which is how a parallel task ends up writing back a
    // truncated file.
    const handle = await open(filename, 'r');
    try {
      await writePrettierFile(filename, '{"generation":2}');

      const buffer = Buffer.alloc(1024);
      const {bytesRead} = await handle.read(buffer, 0, buffer.length, 0);
      expect(JSON.parse(buffer.subarray(0, bytesRead).toString())).toEqual({
        generation: 1,
      });
    } finally {
      await handle.close();
    }

    expect(JSON.parse(await readFile(filename, 'utf-8'))).toEqual({
      generation: 2,
    });
    expect(await readdir(dir)).toEqual(['tsconfig.json']);
  });
});
