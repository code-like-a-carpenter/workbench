import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

import {loadTsConfig, readTsConfig} from './tsconfig.mjs';

const CONFIG = {
  compilerOptions: {noEmit: true},
  extends: './tsconfig.base.json',
  include: ['src'],
};

describe('tsconfig', () => {
  /** @type {string} */
  let dir;
  /** @type {string} */
  let filename;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'load-ts-config-'));
    filename = path.join(dir, 'tsconfig.json');
  });

  afterEach(async () => {
    await rm(dir, {force: true, recursive: true});
  });

  describe('readTsConfig()', () => {
    it('returns the parsed contents of an existing file', async () => {
      await writeFile(filename, JSON.stringify(CONFIG));

      expect(await readTsConfig(filename)).toEqual(CONFIG);
    });

    it('throws when the file does not exist', async () => {
      await expect(readTsConfig(filename)).rejects.toThrow(/ENOENT/);
    });

    it('throws when the file is empty', async () => {
      await writeFile(filename, '');

      await expect(readTsConfig(filename)).rejects.toThrow(/is empty/);
    });

    it('throws when the file is truncated', async () => {
      await writeFile(filename, '{\n  "compilerOptions": {\n    "noEmi');

      await expect(readTsConfig(filename)).rejects.toThrow(/not valid JSON/);
    });
  });

  describe('loadTsConfig()', () => {
    it('returns the parsed contents of an existing file', async () => {
      await writeFile(filename, JSON.stringify(CONFIG));

      expect(await loadTsConfig(filename)).toEqual(CONFIG);
    });

    it('returns a default when the file does not exist', async () => {
      expect(await loadTsConfig(filename)).toEqual({
        compilerOptions: {outDir: './dist/types', rootDir: './src'},
        extends: '../../../tsconfig.references.json',
        include: ['src'],
      });
    });

    it('throws when the file is empty', async () => {
      await writeFile(filename, '');

      await expect(loadTsConfig(filename)).rejects.toThrow(/is empty/);
    });

    it('throws when the file is truncated', async () => {
      await writeFile(filename, '{\n  "compilerOptions": {\n    "noEmi');

      await expect(loadTsConfig(filename)).rejects.toThrow(/not valid JSON/);
    });
  });
});
