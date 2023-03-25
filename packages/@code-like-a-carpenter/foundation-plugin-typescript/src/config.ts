import type {Config as ParserConfig} from '@code-like-a-carpenter/foundation-parser';

export interface Config extends ParserConfig {
  legacyEmptySortFieldBehavior?: boolean;
}
