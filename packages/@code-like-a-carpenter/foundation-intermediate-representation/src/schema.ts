import fs from 'node:fs';
import path from 'node:path';

function loadSchema() {
  try {
    // we're in dist.
    return fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'schema.graphqls'),
      'utf8'
    );
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      // we're in src.
      return fs.readFileSync(
        path.resolve(__dirname, '..', 'schema.graphqls'),
        'utf8'
      );
    }
    throw err;
  }
}
export const schema = loadSchema();
