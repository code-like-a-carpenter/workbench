import type {Condition} from '@code-like-a-carpenter/foundation-intermediate-representation';

export interface Config {
  conditions: Record<string, unknown>;
  tableDefaults: {
    enableEncryption: Condition;
    enablePointInTimeRecovery: Condition;
  };
}

export const defaultConfig: Config = {
  conditions: {
    IsProd: {
      'Fn::Equals': ['StageName', 'Production'],
    },
  },
  tableDefaults: {
    enableEncryption: 'IsProd',
    enablePointInTimeRecovery: 'IsProd',
  },
};

export function applyDefaults<T extends Config>(config: T): T {
  return {
    ...defaultConfig,
    ...config,
    conditions: {
      ...defaultConfig.conditions,
      ...config.conditions,
    },
    tableDefaults: {
      ...defaultConfig.tableDefaults,
      ...config.tableDefaults,
    },
  };
}
