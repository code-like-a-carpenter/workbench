import type {DumpOptions} from 'js-yaml';

import type {Config as ParserConfig} from '@code-like-a-carpenter/foundation-parser';

export interface Config extends ParserConfig {
  outputConfig?: {
    format?: 'json' | 'yaml';
    yamlConfig?: Partial<DumpOptions>;
  };
}
