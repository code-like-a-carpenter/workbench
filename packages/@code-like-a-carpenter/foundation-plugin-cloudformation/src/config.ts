import type {DumpOptions} from 'js-yaml';

export interface Config {
  outputConfig?: {
    format?: 'json' | 'yaml';
    yamlConfig?: Partial<DumpOptions>;
  };
}
